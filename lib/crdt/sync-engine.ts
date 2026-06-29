export type SyncStatus = "idle" | "connecting" | "synced" | "syncing" | "offline" | "error"

export type SyncStateListener = (status: SyncStatus) => void

export class SyncStateManager {
  private status: SyncStatus = "idle"
  private listeners: Set<SyncStateListener> = new Set()

  getStatus(): SyncStatus {
    return this.status
  }

  setStatus(status: SyncStatus) {
    if (this.status !== status) {
      this.status = status
      this.listeners.forEach((listener) => listener(status))
    }
  }

  subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener)
    listener(this.status)
    return () => this.listeners.delete(listener)
  }
}
