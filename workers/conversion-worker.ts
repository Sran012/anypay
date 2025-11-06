import { query } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getCoinDCXClient } from "@/lib/coindcx-client"
import { payoutQueue } from "@/lib/queue"
import { v4 as uuidv4 } from "uuid"

export async function processConversion(invoiceId: string, depositId: string) {
  try {
    logger.info("[ConversionWorker] Starting conversion", { invoiceId, depositId })

    // 1. Lock invoice
    const lockResult = await query(
      `UPDATE invoices 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = $3
       RETURNING *`,
      ["converting", invoiceId, "received"],
    )

    if (lockResult.rows.length === 0) {
      logger.warn("[ConversionWorker] Invoice not in received state", { invoiceId })
      return
    }

    const invoice = lockResult.rows[0]

    // 2. Get deposit details
    const depositResult = await query("SELECT amount_token FROM deposits WHERE id = $1", [depositId])

    if (depositResult.rows.length === 0) {
      throw new Error("Deposit not found")
    }

    const deposit = depositResult.rows[0]
    const amountToken = deposit.amount_token

    // 3. Get exchange rate
    const coindcx = getCoinDCXClient()
    const rateTokenToInr = await coindcx.getExchangeRate(invoice.token_type, "INR")

    const amountInrGross = amountToken * rateTokenToInr
    const platformFeePercent = Number.parseFloat(process.env.PLATFORM_FEE_PERCENT || "1.5")
    const platformFeeInr = (amountInrGross * platformFeePercent) / 100
    const amountInrNet = amountInrGross - platformFeeInr

    // 4. Create conversion record
    const conversionId = uuidv4()
    const conversionResult = await query(
      `INSERT INTO conversions 
       (id, invoice_id, deposit_id, amount_token, rate_token_to_inr, amount_inr_gross, platform_fee_inr, amount_inr_net, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        conversionId,
        invoiceId,
        depositId,
        amountToken,
        rateTokenToInr,
        amountInrGross,
        platformFeeInr,
        amountInrNet,
        "processing",
      ],
    )

    logger.info("[ConversionWorker] Conversion created", {
      conversionId,
      amountInrGross,
      platformFeeInr,
      amountInrNet,
    })

    // 5. Place market sell order on CoinDCX
    const idempotencyKey = `conv_${conversionId}`
    const orderResponse = await coindcx.placeMarketSellOrder(invoice.token_type, amountToken, idempotencyKey)

    // 6. Update conversion with order ID
    await query(
      `UPDATE conversions 
       SET exchange_order_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [orderResponse.id, "completed", conversionId],
    )

    logger.info("[ConversionWorker] Order placed on CoinDCX", { orderId: orderResponse.id })

    // 7. Enqueue payout job
    await payoutQueue.add(
      "process-payout",
      {
        invoiceId,
        conversionId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    )

    logger.info("[ConversionWorker] Payout job enqueued", { invoiceId })
  } catch (error) {
    logger.error("[ConversionWorker] Error", error)

    // Update conversion status to failed
    await query(
      `UPDATE conversions 
       SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
       WHERE invoice_id = $3`,
      ["failed", error instanceof Error ? error.message : "Unknown error", invoiceId],
    )

    // Update invoice status to failed
    await query(
      `UPDATE invoices 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      ["failed", invoiceId],
    )

    throw error
  }
}
