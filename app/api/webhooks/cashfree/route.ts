import { query } from "@/lib/db"
import { verifyCashfreeWebhook } from "@/lib/webhook-signature"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get("x-cashfree-signature") || ""
    const secret = process.env.CASHFREE_CLIENT_SECRET || ""

    if (!verifyCashfreeWebhook(payload, signature, secret)) {
      logger.warn("Invalid Cashfree webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(payload)
    logger.info("Cashfree webhook received", { eventType: event.type })

    // Store webhook event
    await query("INSERT INTO webhook_events (provider, event_type, payload) VALUES ($1, $2, $3)", [
      "cashfree",
      event.type,
      JSON.stringify(event),
    ])

    // Handle payout success/failure
    if (event.type === "PAYOUT_SUCCESS") {
      const { payoutId } = event

      await query(
        `UPDATE payouts 
         SET status = $1, payout_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ["completed", payoutId, payoutId],
      )

      // Update invoice status
      await query(
        `UPDATE invoices 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = (SELECT invoice_id FROM payouts WHERE payout_id = $2)`,
        ["paid", payoutId],
      )

      logger.info("Payout completed", { payoutId })
    } else if (event.type === "PAYOUT_FAILED") {
      const { payoutId, reason } = event

      await query(
        `UPDATE payouts 
         SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ["failed", reason, payoutId],
      )

      logger.error("Payout failed", { payoutId, reason })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Cashfree webhook error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
