import { query } from "@/lib/db"
import { verifyAlchemyWebhook } from "@/lib/webhook-signature"
import { logger } from "@/lib/logger"
import { getRedis } from "@/lib/redis"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get("x-alchemy-signature") || ""
    const authToken = process.env.ALCHEMY_AUTH_TOKEN || ""

    // Verify webhook signature
    if (!verifyAlchemyWebhook(payload, signature, authToken)) {
      logger.warn("Invalid Alchemy webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(payload)
    logger.info("Alchemy webhook received", { eventType: event.type })

    // Store webhook event for audit
    await query("INSERT INTO webhook_events (provider, event_type, payload) VALUES ($1, $2, $3)", [
      "alchemy",
      event.type,
      JSON.stringify(event),
    ])

    // Process deposit detection
    if (event.type === "MINED_TRANSACTION") {
      const { transaction } = event
      const toAddress = transaction.to?.toLowerCase()

      // Find invoice by deposit address
      const invoiceResult = await query("SELECT id FROM invoices WHERE LOWER(deposit_address) = $1 AND status = $2", [
        toAddress,
        "pending",
      ])

      if (invoiceResult.rows.length > 0) {
        const invoiceId = invoiceResult.rows[0].id
        const txHash = transaction.hash
        const fromAddress = transaction.from
        const amountToken = Number.parseFloat(transaction.value) / 1e18 // Assuming 18 decimals

        // Create deposit record
        const depositResult = await query(
          `INSERT INTO deposits (invoice_id, tx_hash, from_address, amount_token, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [invoiceId, txHash, fromAddress, amountToken, "pending"],
        )

        logger.info("Deposit detected", { invoiceId, txHash, amountToken })

        // Enqueue conversion job
        const redis = await getRedis()
        await redis.lPush(
          "conversion-queue",
          JSON.stringify({
            invoiceId,
            depositId: depositResult.rows[0].id,
          }),
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Alchemy webhook error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
