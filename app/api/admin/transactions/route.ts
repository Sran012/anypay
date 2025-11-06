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
    if (!payload || payload.userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query_text = `
      SELECT 
        i.id,
        i.freelancer_id,
        i.amount_usd,
        i.amount_token,
        i.token_type,
        i.status,
        i.created_at,
        d.tx_hash,
        d.confirmations,
        c.amount_inr_net,
        c.status as conversion_status,
        p.status as payout_status,
        p.payout_id,
        u.email as freelancer_email
      FROM invoices i
      LEFT JOIN deposits d ON i.id = d.invoice_id
      LEFT JOIN conversions c ON i.id = c.invoice_id
      LEFT JOIN payouts p ON i.id = p.invoice_id
      LEFT JOIN users u ON i.freelancer_id = u.id
    `

    const params: any[] = []

    if (status) {
      query_text += ` WHERE i.status = $${params.length + 1}`
      params.push(status)
    }

    query_text += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(query_text, params)

    logger.info("Admin transactions fetched", { count: result.rows.length })

    return NextResponse.json(result.rows)
  } catch (error) {
    logger.error("Admin transactions fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
