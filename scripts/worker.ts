import { conversionQueue, payoutQueue } from "@/lib/queue"
import { processConversion } from "@/workers/conversion-worker"
import { processPayout } from "@/workers/payout-worker"
import { logger } from "@/lib/logger"

async function startWorkers() {
  try {
    logger.info("[Worker] Starting background job processors")

    // Setup queue listeners
    conversionQueue.on("completed", (job) => {
      logger.info("[Worker] Conversion job completed", { jobId: job.id })
    })

    conversionQueue.on("failed", (job, err) => {
      logger.error("[Worker] Conversion job failed", { jobId: job?.id, error: err.message })
    })

    payoutQueue.on("completed", (job) => {
      logger.info("[Worker] Payout job completed", { jobId: job.id })
    })

    payoutQueue.on("failed", (job, err) => {
      logger.error("[Worker] Payout job failed", { jobId: job?.id, error: err.message })
    })

    // Process conversion jobs
    conversionQueue.process("process-conversion", async (job) => {
      const { invoiceId, depositId } = job.data
      await processConversion(invoiceId, depositId)
    })

    // Process payout jobs
    payoutQueue.process("process-payout", async (job) => {
      const { invoiceId, conversionId } = job.data
      await processPayout(invoiceId, conversionId)
    })

    logger.info("[Worker] Background job processors started")

    // Keep process alive
    process.on("SIGTERM", async () => {
      logger.info("[Worker] Shutting down gracefully")
      await conversionQueue.close()
      await payoutQueue.close()
      process.exit(0)
    })
  } catch (error) {
    logger.error("[Worker] Startup error", error)
    process.exit(1)
  }
}

startWorkers()
