"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Trash2, LogOut, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  ownerId: string
  owner: { id: string; name: string; email: string }
  access: { id: string; role: string; user: { id: string; name: string; email: string } }[]
}

export default function DocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments()
    }
  }, [status])

  async function fetchDocuments() {
    const res = await fetch("/api/documents")
    if (res.ok) {
      const data = await res.json()
      setDocuments(data)
    }
    setLoading(false)
  }

  async function createDocument() {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    })
    if (res.ok) {
      const doc = await res.json()
      router.push(`/editor/${doc.id}`)
    }
  }

  async function deleteDocument(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this document?")) return
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" })
    if (res.ok) {
      setDocuments((docs) => docs.filter((d) => d.id !== id))
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">CollabEdit</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.user?.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <Button onClick={createDocument} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New document
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="border rounded-lg p-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium mb-1">No documents yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first document to get started.
            </p>
            <Button onClick={createDocument} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New document
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 cursor-pointer group transition-colors"
                onClick={() => router.push(`/editor/${doc.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={doc.ownerId === session?.user?.id ? "default" : "secondary"} className="text-xs hidden sm:flex">
                    {doc.ownerId === session?.user?.id
                      ? "Owner"
                      : doc.access.find((a) => a.user.id === session?.user?.id)?.role || "Viewer"}
                  </Badge>
                  {doc.ownerId === session?.user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={(e) => deleteDocument(doc.id, e)}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
