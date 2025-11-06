import { query } from "@/lib/db"
import { extractTokenFromHeader, verifyToken } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization") || "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.userType !== "freelancer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await query(
      `SELECT i.*, 
              COALESCE(d.status, 'no_deposit') as deposit_status,
              COALESCE(d.amount_token, 0) as deposit_amount,
              COALESCE(c.status, 'no_conversion') as conversion_status,
              COALESCE(p.status, 'no_payout') as payout_status
       FROM invoices i
       LEFT JOIN deposits d ON i.id = d.invoice_id
       LEFT JOIN conversions c ON i.id = c.invoice_id
       LEFT JOIN payouts p ON i.id = p.invoice_id
       WHERE i.freelancer_id = $1
       ORDER BY i.created_at DESC`,
      [payload.userId],
    )

    logger.info("Invoices fetched", { freelancerId: payload.userId, count: result.rows.length })

    return NextResponse.json(result.rows)
  } catch (error) {
    logger.error("Invoices fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
