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

    // Get all conversions
    const conversionsResult = await query(
      `SELECT id, invoice_id, amount_inr_net, status 
       FROM conversions 
       WHERE status = $1`,
      ["completed"],
    )

    // Get all payouts
    const payoutsResult = await query(
      `SELECT id, invoice_id, amount_inr, status 
       FROM payouts 
       WHERE status IN ($1, $2)`,
      ["completed", "pending"],
    )

    const conversions = conversionsResult.rows
    const payouts = payoutsResult.rows

    // Find mismatches
    const mismatches = []

    for (const conversion of conversions) {
      const payout = payouts.find((p) => p.invoice_id === conversion.invoice_id)

      if (!payout) {
        mismatches.push({
          type: "missing_payout",
          conversionId: conversion.id,
          invoiceId: conversion.invoice_id,
          expectedAmount: conversion.amount_inr_net,
        })
      } else if (Math.abs(payout.amount_inr - conversion.amount_inr_net) > 0.01) {
        mismatches.push({
          type: "amount_mismatch",
          conversionId: conversion.id,
          payoutId: payout.id,
          invoiceId: conversion.invoice_id,
          expectedAmount: conversion.amount_inr_net,
          actualAmount: payout.amount_inr,
        })
      }
    }

    logger.info("Reconciliation completed", { mismatches: mismatches.length })

    return NextResponse.json({
      totalConversions: conversions.length,
      totalPayouts: payouts.length,
      mismatches,
    })
  } catch (error) {
    logger.error("Reconciliation error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
