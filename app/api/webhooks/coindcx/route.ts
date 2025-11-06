import { query } from "@/lib/db"
import { verifyCoinDCXWebhook } from "@/lib/webhook-signature"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get("x-coindcx-signature") || ""
    const secret = process.env.COINDCX_API_SECRET || ""

    if (!verifyCoinDCXWebhook(payload, signature, secret)) {
      logger.warn("Invalid CoinDCX webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(payload)
    logger.info("CoinDCX webhook received", { eventType: event.type })

    // Store webhook event
    await query("INSERT INTO webhook_events (provider, event_type, payload) VALUES ($1, $2, $3)", [
      "coindcx",
      event.type,
      JSON.stringify(event),
    ])

    // Handle order fill event
    if (event.type === "ORDER_FILLED") {
      const { orderId, filledAmount, rate } = event

      // Update conversion record
      await query(
        `UPDATE conversions 
         SET exchange_order_id = $1, rate_token_to_inr = $2, status = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = (SELECT conversion_id FROM payouts WHERE payout_id = $4)`,
        [orderId, rate, "completed", orderId],
      )

      logger.info("Order filled on CoinDCX", { orderId, rate })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("CoinDCX webhook error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
