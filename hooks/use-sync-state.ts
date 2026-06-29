"use client"

import { useState, useEffect, useCallback } from "react"
import { SyncStateManager, SyncStatus } from "@/lib/crdt/sync-engine"

export function useSyncState(syncManager: SyncStateManager | null) {
  const [status, setStatus] = useState<SyncStatus>("idle")

  useEffect(() => {
    if (!syncManager) return
    return syncManager.subscribe(setStatus)
  }, [syncManager])

  return status
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
