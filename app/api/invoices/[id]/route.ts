import { query } from "@/lib/db"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const result = await query(
      `SELECT i.*, 
              COALESCE(d.status, 'no_deposit') as deposit_status,
              COALESCE(d.amount_token, 0) as deposit_amount,
              COALESCE(d.confirmations, 0) as deposit_confirmations,
              COALESCE(c.status, 'no_conversion') as conversion_status,
              COALESCE(p.status, 'no_payout') as payout_status
       FROM invoices i
       LEFT JOIN deposits d ON i.id = d.invoice_id
       LEFT JOIN conversions c ON i.id = c.invoice_id
       LEFT JOIN payouts p ON i.id = p.invoice_id
       WHERE i.id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    logger.error("Invoice fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
