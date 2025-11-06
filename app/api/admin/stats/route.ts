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

    // Total invoices
    const totalInvoicesResult = await query("SELECT COUNT(*) as count FROM invoices")
    const totalInvoices = Number.parseInt(totalInvoicesResult.rows[0].count)

    // Paid invoices
    const paidInvoicesResult = await query("SELECT COUNT(*) as count FROM invoices WHERE status = $1", ["paid"])
    const paidInvoices = Number.parseInt(paidInvoicesResult.rows[0].count)

    // Failed invoices
    const failedInvoicesResult = await query("SELECT COUNT(*) as count FROM invoices WHERE status = $1", ["failed"])
    const failedInvoices = Number.parseInt(failedInvoicesResult.rows[0].count)

    // Total volume (USD)
    const volumeResult = await query("SELECT SUM(amount_usd) as total FROM invoices WHERE status = $1", ["paid"])
    const totalVolume = Number.parseFloat(volumeResult.rows[0].total || 0)

    // Total platform fees
    const feesResult = await query("SELECT SUM(platform_fee_inr) as total FROM conversions WHERE status = $1", [
      "completed",
    ])
    const totalFees = Number.parseFloat(feesResult.rows[0].total || 0)

    // Active freelancers
    const freelancersResult = await query(
      "SELECT COUNT(DISTINCT freelancer_id) as count FROM invoices WHERE created_at > NOW() - INTERVAL '30 days'",
    )
    const activeFreelancers = Number.parseInt(freelancersResult.rows[0].count)

    // Pending conversions
    const pendingConversionsResult = await query("SELECT COUNT(*) as count FROM conversions WHERE status = $1", [
      "pending",
    ])
    const pendingConversions = Number.parseInt(pendingConversionsResult.rows[0].count)

    // Failed payouts
    const failedPayoutsResult = await query("SELECT COUNT(*) as count FROM payouts WHERE status = $1", ["failed"])
    const failedPayouts = Number.parseInt(failedPayoutsResult.rows[0].count)

    logger.info("Admin stats fetched")

    return NextResponse.json({
      totalInvoices,
      paidInvoices,
      failedInvoices,
      totalVolume,
      totalFees,
      activeFreelancers,
      pendingConversions,
      failedPayouts,
    })
  } catch (error) {
    logger.error("Admin stats fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
