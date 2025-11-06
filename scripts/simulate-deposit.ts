import crypto from "crypto"

/**
 * Simulates an Alchemy webhook for testing deposit detection
 * Usage: npx ts-node scripts/simulate-deposit.ts <invoiceId> <depositAddress> <amount>
 */

const invoiceId = process.argv[2] || "test-invoice-123"
const depositAddress = process.argv[3] || "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
const amount = process.argv[4] || "100"

const payload = {
  type: "MINED_TRANSACTION",
  transaction: {
    hash: `0x${crypto.randomBytes(32).toString("hex")}`,
    to: depositAddress,
    from: `0x${crypto.randomBytes(20).toString("hex")}`,
    value: (Number.parseFloat(amount) * 1e18).toString(),
    blockNumber: 12345678,
  },
}

const payloadString = JSON.stringify(payload)
const authToken = process.env.ALCHEMY_AUTH_TOKEN || "test-token"
const signature = crypto.createHmac("sha256", authToken).update(payloadString).digest("hex")

console.log("Simulated Alchemy Webhook:")
console.log("========================")
console.log(`URL: POST http://localhost:3000/api/webhooks/alchemy`)
console.log(`Headers:`)
console.log(`  x-alchemy-signature: ${signature}`)
console.log(`Body:`)
console.log(JSON.stringify(payload, null, 2))
console.log("")
console.log("To send this webhook, run:")
console.log(`curl -X POST http://localhost:3000/api/webhooks/alchemy \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -H "x-alchemy-signature: ${signature}" \\`)
console.log(`  -d '${payloadString}'`)
