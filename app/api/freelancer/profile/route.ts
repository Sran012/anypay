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
      `SELECT fp.*, u.email, u.kyc_status
       FROM freelancer_profiles fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.user_id = $1`,
      [payload.userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    logger.error("Profile fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization") || "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.userType !== "freelancer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { fullName, bankAccountNumber, bankIfscCode, upiId, payoutMethod } = await req.json()

    const result = await query(
      `UPDATE freelancer_profiles 
       SET full_name = COALESCE($1, full_name),
           bank_account_number = COALESCE($2, bank_account_number),
           bank_ifsc_code = COALESCE($3, bank_ifsc_code),
           upi_id = COALESCE($4, upi_id),
           payout_method = COALESCE($5, payout_method),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [fullName, bankAccountNumber, bankIfscCode, upiId, payoutMethod, payload.userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    logger.info("Profile updated", { userId: payload.userId })

    return NextResponse.json(result.rows[0])
  } catch (error) {
    logger.error("Profile update error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
