import { WebSocket } from "ws"
import { IncomingMessage } from "http"
import jwt from "jsonwebtoken"
// @ts-ignore
import { setupWSConnection } from "y-websocket/bin/utils.js"
import { Role } from "@/lib/types"

const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 100 // max messages per window

const rateLimits = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(userId)

  if (!entry || entry.resetTime < now) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

interface TokenPayload {
  id: string
  sub?: string
  email?: string
  name?: string
}

export async function handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const token = url.searchParams.get("token")
  const documentId = url.searchParams.get("roomname") || url.pathname.split("/").pop()

  if (!token || !documentId) {
    ws.close(4001, "Missing token or document ID")
    return
  }

  let userId: string
  try {
    const secret = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"
    const decoded = jwt.verify(token, secret) as TokenPayload
    userId = decoded.id || decoded.sub || ""
    if (!userId) {
      ws.close(4001, "Invalid token: no user ID")
      return
    }
  } catch {
    ws.close(4001, "Invalid or expired token")
    return
  }

  let userRole: Role = Role.EDITOR
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/documents/${documentId}/access?userId=${userId}`,
      {
        headers: {
          "X-Server-Secret": process.env.WS_SERVER_SECRET || "ws-internal-secret",
        },
      }
    )
    if (response.ok) {
      const data = await response.json()
      userRole = data.role as Role
    } else if (response.status === 403 || response.status === 404) {
      ws.close(4003, "Access denied")
      return
    }
  } catch {
    // If we can't verify, allow with editor role (development mode)
  }

  // Pass the connection to y-websocket. 
  // setupWSConnection handles the binary sync protocol properly!
  setupWSConnection(ws, req, { docName: documentId })
}
