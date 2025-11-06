import { createClient } from "redis"

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    })
    await redisClient.connect()
  }
  return redisClient
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
