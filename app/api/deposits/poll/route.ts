import { query } from "@/lib/db"
import { getBlockchainMonitor } from "@/lib/blockchain-monitor"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const adminSecret = req.headers.get("x-admin-secret")
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("[DepositPoller] Starting deposit polling")

    const monitor = getBlockchainMonitor()
    await monitor.pollForDeposits()

    // Check for deposits that need confirmation
    const depositsResult = await query(
      `SELECT id, confirmations FROM deposits 
       WHERE status = $1 AND confirmations < $2`,
      ["pending", Number.parseInt(process.env.DEPOSIT_CONFIRMATION_BLOCKS || "3")],
    )

    const deposits = depositsResult.rows

    for (const deposit of deposits) {
      await monitor.confirmDeposit(deposit.id)
    }

    logger.info("[DepositPoller] Polling completed", { depositsChecked: deposits.length })

    return NextResponse.json({
      success: true,
      depositsChecked: deposits.length,
    })
  } catch (error) {
    logger.error("[DepositPoller] Error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
