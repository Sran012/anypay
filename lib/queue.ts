import { Queue, Worker } from "bullmq"

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: Number.parseInt(process.env.REDIS_URL?.split(":")[2] || "6379"),
}

export const conversionQueue = new Queue("conversions", { connection })
export const payoutQueue = new Queue("payouts", { connection })

export async function setupWorkers() {
  // Conversion worker
  new Worker(
    "conversions",
    async (job) => {
      const { invoiceId, depositId } = job.data
      console.log(`[Worker] Processing conversion for invoice ${invoiceId}`)
      // Worker logic will be implemented in worker.ts
    },
    { connection },
  )

  // Payout worker
  new Worker(
    "payouts",
    async (job) => {
      const { invoiceId, conversionId } = job.data
      console.log(`[Worker] Processing payout for invoice ${invoiceId}`)
      // Worker logic will be implemented in worker.ts
    },
    { connection },
  )
}
