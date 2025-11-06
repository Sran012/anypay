import { query } from "@/lib/db"
import { extractTokenFromHeader, verifyToken } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { payoutQueue } from "@/lib/queue"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization") || "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { payoutId } = await req.json()

    if (!payoutId) {
      return NextResponse.json({ error: "Missing payoutId" }, { status: 400 })
    }

    // Get payout details
    const payoutResult = await query("SELECT * FROM payouts WHERE id = $1", [payoutId])

    if (payoutResult.rows.length === 0) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    const payout = payoutResult.rows[0]

    // Reset payout status
    await query(
      `UPDATE payouts 
       SET status = $1, retry_count = 0, error_message = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      ["pending", payoutId],
    )

    // Enqueue retry job
    await payoutQueue.add(
      "process-payout",
      {
        invoiceId: payout.invoice_id,
        conversionId: payout.conversion_id,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    )

    logger.info("Payout retry enqueued", { payoutId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Payout retry error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
