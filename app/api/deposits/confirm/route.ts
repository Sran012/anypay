import { query } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getBlockchainMonitor } from "@/lib/blockchain-monitor"
import { conversionQueue } from "@/lib/queue"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { depositId, confirmations } = await req.json()

    if (!depositId) {
      return NextResponse.json({ error: "Missing depositId" }, { status: 400 })
    }

    const requiredConfirmations = confirmations || Number.parseInt(process.env.DEPOSIT_CONFIRMATION_BLOCKS || "3")

    // Get deposit
    const depositResult = await query("SELECT * FROM deposits WHERE id = $1", [depositId])

    if (depositResult.rows.length === 0) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 })
    }

    const deposit = depositResult.rows[0]

    // Check confirmations via blockchain monitor
    const monitor = getBlockchainMonitor()
    await monitor.confirmDeposit(depositId, requiredConfirmations)

    // Update deposit status
    const updateResult = await query(
      `UPDATE deposits 
       SET status = $1, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      ["confirmed", depositId],
    )

    const confirmedDeposit = updateResult.rows[0]

    // Update invoice status
    await query(
      `UPDATE invoices 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      ["received", deposit.invoice_id],
    )

    // Enqueue conversion job
    await conversionQueue.add(
      "process-conversion",
      {
        invoiceId: deposit.invoice_id,
        depositId: depositId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    )

    logger.info("Deposit confirmed and conversion queued", { depositId, invoiceId: deposit.invoice_id })

    return NextResponse.json(confirmedDeposit)
  } catch (error) {
    logger.error("Deposit confirmation error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
