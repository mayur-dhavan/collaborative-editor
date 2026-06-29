import * as Y from "yjs"
import { WebSocket } from "ws"
import { Role } from "@/lib/types"

export interface ClientConnection {
  ws: WebSocket
  userId: string
  role: Role
}

export class DocumentRoom {
  public ydoc: Y.Doc
  public documentId: string
  private connections: Map<WebSocket, ClientConnection> = new Map()
  private persistTimer: ReturnType<typeof setTimeout> | null = null
  private evictionTimer: ReturnType<typeof setTimeout> | null = null
  private dirty = false

  constructor(documentId: string, initialState?: Uint8Array) {
    this.documentId = documentId
    this.ydoc = new Y.Doc()

    if (initialState) {
      Y.applyUpdate(this.ydoc, initialState)
    }

    this.ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      this.dirty = true
      this.broadcastUpdate(update, origin as WebSocket)
      this.schedulePersist()
    })
  }

  addConnection(ws: WebSocket, userId: string, role: Role): void {
    this.connections.set(ws, { ws, userId, role })
    if (this.evictionTimer) {
      clearTimeout(this.evictionTimer)
      this.evictionTimer = null
    }
  }

  removeConnection(ws: WebSocket): void {
    this.connections.delete(ws)
    if (this.connections.size === 0) {
      this.evictionTimer = setTimeout(() => {
        this.persistNow()
        rooms.delete(this.documentId)
        this.ydoc.destroy()
      }, 60000)
    }
  }

  getConnection(ws: WebSocket): ClientConnection | undefined {
    return this.connections.get(ws)
  }

  getConnectionCount(): number {
    return this.connections.size
  }

  applyUpdate(update: Uint8Array, origin: WebSocket): void {
    Y.applyUpdate(this.ydoc, update, origin)
  }

  private broadcastUpdate(update: Uint8Array, origin: WebSocket): void {
    this.connections.forEach(({ ws }) => {
      if (ws !== origin && ws.readyState === WebSocket.OPEN) {
        ws.send(update)
      }
    })
  }

  private schedulePersist(): void {
    if (this.persistTimer) return
    this.persistTimer = setTimeout(() => {
      this.persistNow()
      this.persistTimer = null
    }, 5000)
  }

  async persistNow(): Promise<void> {
    if (!this.dirty) return
    this.dirty = false

    try {
      const state = Y.encodeStateAsUpdate(this.ydoc)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/documents/${this.documentId}/state`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Server-Secret": process.env.WS_SERVER_SECRET || "ws-internal-secret",
          },
          body: Buffer.from(state),
        }
      )
      if (!response.ok) {
        console.error(`Failed to persist document ${this.documentId}: ${response.status}`)
        this.dirty = true
      }
    } catch (error) {
      console.error(`Error persisting document ${this.documentId}:`, error)
      this.dirty = true
    }
  }
}

export const rooms = new Map<string, DocumentRoom>()

export async function getOrCreateRoom(documentId: string): Promise<DocumentRoom> {
  let room = rooms.get(documentId)
  if (room) return room

  let initialState: Uint8Array | undefined
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/documents/${documentId}/state`,
      {
        headers: {
          "X-Server-Secret": process.env.WS_SERVER_SECRET || "ws-internal-secret",
        },
      }
    )
    if (response.ok) {
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > 0) {
        initialState = new Uint8Array(buffer)
      }
    }
  } catch (error) {
    console.error(`Failed to load document ${documentId}:`, error)
  }

  room = new DocumentRoom(documentId, initialState)
  rooms.set(documentId, room)
  return room
}
