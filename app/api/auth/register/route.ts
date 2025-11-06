import { query } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { logger } from "@/lib/logger"
import bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, password, userType, fullName } = await req.json()

    if (!email || !password || !userType || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (userType !== "freelancer" && userType !== "admin") {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const userResult = await query(
      "INSERT INTO users (email, password_hash, user_type) VALUES ($1, $2, $3) RETURNING id, email, user_type",
      [email, passwordHash, userType],
    )

    const user = userResult.rows[0]

    // Create freelancer profile if applicable
    if (userType === "freelancer") {
      await query("INSERT INTO freelancer_profiles (user_id, full_name) VALUES ($1, $2)", [user.id, fullName])
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    })

    logger.info("User registered", { userId: user.id, email })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          userType: user.user_type,
        },
        token,
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error("Registration error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
