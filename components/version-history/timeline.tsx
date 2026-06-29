"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, RotateCcw, Clock, Camera } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Version {
  id: string
  label: string | null
  createdAt: string
  creator: { id: string; name: string }
}

interface VersionHistoryProps {
  documentId: string
  onClose: () => void
}

export function VersionHistory({ documentId, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [documentId])

  async function fetchVersions() {
    const res = await fetch(`/api/documents/${documentId}/versions`)
    if (res.ok) {
      setVersions(await res.json())
    }
    setLoading(false)
  }

  async function createSnapshot() {
    // This is triggered from the editor; here we just refresh
    await fetchVersions()
  }

  async function restoreVersion(versionId: string) {
    if (!confirm("Restore this version? Current content will be replaced.")) return

    setRestoring(versionId)
    const res = await fetch(
      `/api/documents/${documentId}/versions/${versionId}/restore`,
      { method: "POST" }
    )

    if (res.ok) {
      window.location.reload()
    } else {
      alert("Failed to restore version")
    }
    setRestoring(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Version History</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No versions saved yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Versions are saved automatically
              </p>
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium line-clamp-1">
                      {version.label || "Auto-saved version"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {version.creator.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => restoreVersion(version.id)}
                    disabled={restoring === version.id}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {restoring === version.id ? "..." : "Restore"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
