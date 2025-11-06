import { query } from "@/lib/db"
import { logger } from "@/lib/logger"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

/**
 * Setup test data for development
 * Creates test users, invoices, and transactions
 */

async function setupTestData() {
  try {
    logger.info("[Setup] Creating test data...")

    // Create test freelancer
    const freelancerId = uuidv4()
    const passwordHash = await bcrypt.hash("testpassword123", 10)

    await query(
      `INSERT INTO users (id, email, password_hash, user_type, kyc_status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [freelancerId, "freelancer@test.com", passwordHash, "freelancer", "verified"],
    )

    await query(
      `INSERT INTO freelancer_profiles (user_id, full_name, bank_account_number, bank_ifsc_code, payout_method)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [freelancerId, "Test Freelancer", "1234567890123456", "SBIN0001234", "bank"],
    )

    logger.info("[Setup] Test freelancer created", { email: "freelancer@test.com" })

    // Create test admin
    const adminId = uuidv4()
    await query(
      `INSERT INTO users (id, email, password_hash, user_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [adminId, "admin@test.com", passwordHash, "admin"],
    )

    logger.info("[Setup] Test admin created", { email: "admin@test.com" })

    // Create test invoices
    for (let i = 0; i < 3; i++) {
      const invoiceId = uuidv4()
      const depositAddress = `0x${Math.random().toString(16).slice(2)}`

      await query(
        `INSERT INTO invoices 
         (id, freelancer_id, amount_usd, amount_token, token_type, token_network, status, deposit_address, deposit_address_source, public_url, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [
          invoiceId,
          freelancerId,
          100 + i * 50,
          100 + i * 50,
          "USDT",
          "ERC20",
          i === 0 ? "paid" : "pending",
          depositAddress,
          "local_wallet",
          `/f/${invoiceId}`,
          new Date(Date.now() + 60 * 60 * 1000),
        ],
      )

      logger.info("[Setup] Test invoice created", { invoiceId, status: i === 0 ? "paid" : "pending" })
    }

    logger.info("[Setup] Test data setup completed!")
  } catch (error) {
    logger.error("[Setup] Error", error)
    process.exit(1)
  }
}

setupTestData()
