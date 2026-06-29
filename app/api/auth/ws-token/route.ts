import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import jwt from "jsonwebtoken"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const secret = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"
    
    // Sign a token valid for 1 hour to establish the WebSocket connection
    const token = jwt.sign(
      { id: session.user.id },
      secret,
      { expiresIn: "1h" }
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error generating WS token:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
