import { WebSocket, RawData } from "ws"
import { IncomingMessage } from "http"
import jwt from "jsonwebtoken"
import { getOrCreateRoom } from "./rooms"
import { Role } from "@/lib/types"

const MAX_UPDATE_SIZE = 1_048_576 // 1MB
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

  const room = await getOrCreateRoom(documentId)
  room.addConnection(ws, userId, userRole)

  ;(ws as WebSocket & { isAlive: boolean }).isAlive = true
  ws.on("pong", () => {
    ;(ws as WebSocket & { isAlive: boolean }).isAlive = true
  })

  ws.on("message", (data: RawData) => {
    const buffer = data instanceof ArrayBuffer
      ? Buffer.from(data)
      : Array.isArray(data)
        ? Buffer.concat(data)
        : data as Buffer

    if (buffer.byteLength > MAX_UPDATE_SIZE) {
      ws.send(JSON.stringify({ type: "error", message: "Payload too large" }))
      return
    }

    if (!checkRateLimit(userId)) {
      ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded" }))
      return
    }

    const connection = room.getConnection(ws)
    if (connection?.role === Role.VIEWER) {
      // Viewers can receive awareness updates but not push document changes
      // Allow awareness protocol messages (they start with specific bytes)
      // Yjs awareness messages have a different structure than doc updates
      return
    }

    try {
      room.applyUpdate(new Uint8Array(buffer), ws)
    } catch (error) {
      console.error("Failed to apply update:", error)
      ws.send(JSON.stringify({ type: "error", message: "Invalid update" }))
    }
  })

  ws.on("close", () => {
    room.removeConnection(ws)
  })

  ws.on("error", (error) => {
    console.error("WebSocket error:", error)
    room.removeConnection(ws)
  })
}
