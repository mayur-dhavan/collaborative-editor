"use client"

import { SyncStatus } from "@/lib/crdt/sync-engine"
import { cn } from "@/lib/utils"
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react"

interface ConnectionStatusProps {
  status: SyncStatus
}

const statusConfig: Record<SyncStatus, { label: string; color: string; icon: typeof Wifi }> = {
  idle: { label: "Idle", color: "bg-gray-400", icon: Cloud },
  connecting: { label: "Connecting...", color: "bg-yellow-400", icon: Loader2 },
  synced: { label: "Synced", color: "bg-green-500", icon: Wifi },
  syncing: { label: "Syncing...", color: "bg-blue-400", icon: Cloud },
  offline: { label: "Offline", color: "bg-orange-500", icon: WifiOff },
  error: { label: "Error", color: "bg-red-500", icon: CloudOff },
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className={cn("h-2 w-2 rounded-full", config.color)} />
      <Icon className={cn("h-3.5 w-3.5", status === "connecting" && "animate-spin")} />
      <span>{config.label}</span>
    </div>
  )
}
