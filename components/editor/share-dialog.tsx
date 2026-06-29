"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X, UserPlus } from "lucide-react"

interface AccessEntry {
  role: string
  user: { id: string; name: string; email: string }
}

interface ShareDialogProps {
  documentId: string
  currentAccess: AccessEntry[]
  onClose: () => void
}

export function ShareDialog({ documentId, currentAccess, onClose }: ShareDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [access, setAccess] = useState<AccessEntry[]>(currentAccess)

  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch(`/api/documents/${documentId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    })

    if (res.ok) {
      const data = await res.json()
      setAccess([...access, { role: data.role, user: data.user }])
      setEmail("")
    } else {
      const data = await res.json()
      setError(data.error || "Failed to share")
    }
    setLoading(false)
  }

  async function handleRemove(userId: string) {
    const res = await fetch(`/api/documents/${documentId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      setAccess(access.filter((a) => a.user.id !== userId))
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>Invite collaborators by email</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="space-y-4">
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <Button type="submit" size="icon" disabled={loading}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {access.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-medium">People with access</Label>
            {access.map((entry) => (
              <div key={entry.user.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{entry.user.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{entry.role}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRemove(entry.user.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
