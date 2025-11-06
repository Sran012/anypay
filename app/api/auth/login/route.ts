import { query } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { logger } from "@/lib/logger"
import bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const result = await query("SELECT id, email, password_hash, user_type FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    })

    logger.info("User logged in", { userId: user.id })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
      },
      token,
    })
  } catch (error) {
    logger.error("Login error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
