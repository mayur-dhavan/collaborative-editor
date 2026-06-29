import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"
// @ts-ignore
import { WebsocketProvider } from "y-websocket"
import { SyncStateManager, SyncStatus } from "./sync-engine"

export interface YDocManagerOptions {
  documentId: string
  userId: string
  userName: string
  userColor: string
  token: string
  wsUrl: string
}

export class YDocManager {
  public ydoc: Y.Doc
  public syncState: SyncStateManager
  private indexeddbProvider: IndexeddbPersistence | null = null
  private wsProvider: WebsocketProvider | null = null
  private options: YDocManagerOptions

  constructor(options: YDocManagerOptions) {
    this.options = options
    this.ydoc = new Y.Doc()
    this.syncState = new SyncStateManager()
  }

  async initialize(): Promise<void> {
    this.syncState.setStatus("connecting")

    this.indexeddbProvider = new IndexeddbPersistence(
      `doc-${this.options.documentId}`,
      this.ydoc
    )

    await new Promise<void>((resolve) => {
      this.indexeddbProvider!.once("synced", () => resolve())
    })

    this.connect()
  }

  connect(): void {
    if (this.wsProvider) {
      this.wsProvider.destroy()
    }

    const wsUrl = this.options.wsUrl || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000"

    this.wsProvider = new WebsocketProvider(
      wsUrl,
      this.options.documentId,
      this.ydoc,
      {
        params: {
          token: this.options.token,
          userId: this.options.userId,
        },
      }
    )

    this.wsProvider.awareness.setLocalStateField("user", {
      name: this.options.userName,
      color: this.options.userColor,
    })

    this.wsProvider.on("status", ({ status }: { status: string }) => {
      const statusMap: Record<string, SyncStatus> = {
        connecting: "connecting",
        connected: "synced",
        disconnected: "offline",
      }
      this.syncState.setStatus(statusMap[status] || "error")
    })

    this.wsProvider.on("sync", (synced: boolean) => {
      if (synced) {
        this.syncState.setStatus("synced")
      }
    })
  }

  disconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.disconnect()
      this.syncState.setStatus("offline")
    }
  }

  getContent(): Y.XmlFragment {
    return this.ydoc.getXmlFragment("document")
  }

  getAwareness() {
    return this.wsProvider?.awareness || null
  }

  getProvider() {
    return this.wsProvider
  }

  async createSnapshot(): Promise<Uint8Array> {
    return Y.encodeStateAsUpdate(this.ydoc)
  }

  async getStateVector(): Promise<Uint8Array> {
    return Y.encodeStateVector(this.ydoc)
  }

  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.ydoc, update)
  }

  destroy(): void {
    if (this.wsProvider) {
      this.wsProvider.destroy()
      this.wsProvider = null
    }
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy()
      this.indexeddbProvider = null
    }
    this.ydoc.destroy()
  }
}

const USER_COLORS = [
  "#958DF1", "#F98181", "#FBBC88", "#FAF594",
  "#70CFF8", "#94FADB", "#B9F18D", "#C3E2C2",
  "#EAECCC", "#AFC8AD", "#EEC759", "#9BB8CD",
]

export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}
