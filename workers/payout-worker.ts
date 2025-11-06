import { query } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getCashfreeClient } from "@/lib/cashfree-client"
import { v4 as uuidv4 } from "uuid"

export async function processPayout(invoiceId: string, conversionId: string) {
  try {
    logger.info("[PayoutWorker] Starting payout", { invoiceId, conversionId })

    // 1. Get conversion details
    const conversionResult = await query("SELECT amount_inr_net FROM conversions WHERE id = $1", [conversionId])

    if (conversionResult.rows.length === 0) {
      throw new Error("Conversion not found")
    }

    const conversion = conversionResult.rows[0]
    const amountInr = conversion.amount_inr_net

    // 2. Get freelancer details
    const freelancerResult = await query(
      `SELECT u.id, fp.bank_account_number, fp.bank_ifsc_code, fp.upi_id, fp.payout_method
       FROM invoices i
       JOIN users u ON i.freelancer_id = u.id
       JOIN freelancer_profiles fp ON u.id = fp.user_id
       WHERE i.id = $1`,
      [invoiceId],
    )

    if (freelancerResult.rows.length === 0) {
      throw new Error("Freelancer not found")
    }

    const freelancer = freelancerResult.rows[0]

    if (!freelancer.payout_method) {
      throw new Error("Freelancer payout method not configured")
    }

    // 3. Create payout record
    const payoutId = uuidv4()
    const payoutResult = await query(
      `INSERT INTO payouts 
       (id, invoice_id, conversion_id, freelancer_id, amount_inr, payout_provider, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        payoutId,
        invoiceId,
        conversionId,
        freelancer.id,
        amountInr,
        process.env.PAYOUT_PROVIDER || "cashfree",
        "processing",
      ],
    )

    logger.info("[PayoutWorker] Payout record created", { payoutId, amountInr })

    // 4. Initialize payout provider
    const cashfree = getCashfreeClient()

    // 5. Create or verify beneficiary
    const beneficiaryId = `ben_${freelancer.id}`
    await cashfree.createBeneficiary(
      beneficiaryId,
      "Freelancer", // TODO: Get actual name from profile
      "freelancer@example.com", // TODO: Get actual email
      "9999999999", // TODO: Get actual phone
      freelancer.bank_account_number,
      freelancer.bank_ifsc_code,
      freelancer.upi_id,
    )

    logger.info("[PayoutWorker] Beneficiary created/verified", { beneficiaryId })

    // 6. Initiate transfer
    const transferResponse = await cashfree.initiateTransfer(payoutId, beneficiaryId, amountInr, `Invoice ${invoiceId}`)

    // 7. Update payout record
    await query(
      `UPDATE payouts 
       SET payout_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [transferResponse.transfer_id, "pending", payoutId],
    )

    logger.info("[PayoutWorker] Transfer initiated", { transferId: transferResponse.transfer_id })

    // 8. Create ledger entry for freelancer
    await query(
      `INSERT INTO ledger_entries (freelancer_id, amount_inr, entry_type, reason, reference_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [freelancer.id, amountInr, "credit", "Payout from invoice", invoiceId],
    )

    logger.info("[PayoutWorker] Ledger entry created", { freelancerId: freelancer.id })
  } catch (error) {
    logger.error("[PayoutWorker] Error", error)

    // Update payout status to failed
    const payoutUpdateResult = await query(
      `UPDATE payouts 
       SET status = $1, error_message = $2, retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE invoice_id = $3
       RETURNING retry_count`,
      ["failed", error instanceof Error ? error.message : "Unknown error", invoiceId],
    )

    if (payoutUpdateResult.rows.length > 0) {
      const retryCount = payoutUpdateResult.rows[0].retry_count
      if (retryCount >= 3) {
        logger.error("[PayoutWorker] Max retries exceeded, creating operator ticket", { invoiceId })
        // TODO: Create operator ticket for manual intervention
      }
    }

    throw error
  }
}
