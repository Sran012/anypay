import { query } from "@/lib/db"
import { getRedis } from "@/lib/redis"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Check database
    const dbResult = await query("SELECT 1")
    const dbHealthy = dbResult.rows.length > 0

    // Check Redis
    let redisHealthy = false
    try {
      const redis = await getRedis()
      await redis.ping()
      redisHealthy = true
    } catch {
      redisHealthy = false
    }

    const allHealthy = dbHealthy && redisHealthy

    return NextResponse.json(
      {
        status: allHealthy ? "healthy" : "degraded",
        database: dbHealthy ? "ok" : "error",
        redis: redisHealthy ? "ok" : "error",
        timestamp: new Date().toISOString(),
      },
      { status: allHealthy ? 200 : 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
