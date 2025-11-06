import { extractTokenFromHeader, verifyToken } from "@/lib/auth"
import { conversionQueue, payoutQueue } from "@/lib/queue"
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

    const conversionJobs = await conversionQueue.getJobs(["active", "waiting", "failed"])
    const payoutJobs = await payoutQueue.getJobs(["active", "waiting", "failed"])

    const jobs = [
      ...conversionJobs.map((j) => ({
        type: "conversion",
        id: j.id,
        state: j.getState(),
        data: j.data,
        progress: j.progress(),
        attempts: j.attemptsMade,
        failedReason: j.failedReason,
      })),
      ...payoutJobs.map((j) => ({
        type: "payout",
        id: j.id,
        state: j.getState(),
        data: j.data,
        progress: j.progress(),
        attempts: j.attemptsMade,
        failedReason: j.failedReason,
      })),
    ]

    logger.info("Admin jobs fetched", { count: jobs.length })

    return NextResponse.json(jobs)
  } catch (error) {
    logger.error("Admin jobs fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization") || "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action, jobId, jobType } = await req.json()

    if (action === "retry") {
      const queue = jobType === "conversion" ? conversionQueue : payoutQueue
      const job = await queue.getJob(jobId)

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }

      await job.retry()
      logger.info("Job retried", { jobId, jobType })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    logger.error("Admin job action error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
