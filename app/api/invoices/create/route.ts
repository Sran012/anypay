import { query } from "@/lib/db"
import { extractTokenFromHeader, verifyToken } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { ethers } from "ethers"
import { encryptPrivateKey } from "@/lib/encryption"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization") || "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.userType !== "freelancer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { amountUsd, token: tokenType, tokenNetwork, memo } = await req.json()

    if (!amountUsd || !tokenType || !tokenNetwork) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // TODO: Fetch real exchange rate from CoinGecko
    const amountToken = amountUsd / 1 // Placeholder: 1 USD = 1 token

    const invoiceId = uuidv4()
    const publicUrl = `/f/${invoiceId}`

    let depositAddress = ""
    let depositAddressSource: "local_wallet" | "exchange" = "local_wallet"

    // Generate deposit address
    if (process.env.USE_EXCHANGE_ADDRESS === "true") {
      // TODO: Call exchange API to get deposit address
      depositAddress = `0x${Math.random().toString(16).slice(2)}`
      depositAddressSource = "exchange"
    } else {
      // Generate local wallet address
      const wallet = ethers.Wallet.createRandom()
      depositAddress = wallet.address
      // TODO: Store encrypted private key in secure storage
      const encryptedKey = encryptPrivateKey(wallet.privateKey)
      logger.debug("Generated wallet for invoice", { invoiceId, address: depositAddress })
    }

    const expiresAt = new Date(Date.now() + Number.parseInt(process.env.INVOICE_TTL_MINUTES || "60") * 60 * 1000)

    const result = await query(
      `INSERT INTO invoices 
       (id, freelancer_id, amount_usd, amount_token, token_type, token_network, memo, deposit_address, deposit_address_source, public_url, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        invoiceId,
        payload.userId,
        amountUsd,
        amountToken,
        tokenType,
        tokenNetwork,
        memo,
        depositAddress,
        depositAddressSource,
        publicUrl,
        expiresAt,
        "pending",
      ],
    )

    logger.info("Invoice created", { invoiceId, freelancerId: payload.userId, amountUsd })

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    logger.error("Invoice creation error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
