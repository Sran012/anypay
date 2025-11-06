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
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const result = await query(
      `SELECT * FROM webhook_events 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    logger.info("Admin webhooks fetched", { count: result.rows.length })

    return NextResponse.json(result.rows)
  } catch (error) {
    logger.error("Admin webhooks fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
