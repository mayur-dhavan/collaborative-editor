"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Users, Trash2, Clock, LogOut } from "lucide-react"
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
      body: JSON.stringify({ title: "Untitled Document" }),
    })
    if (res.ok) {
      const doc = await res.json()
      router.push(`/editor/${doc.id}`)
    }
  }

  async function deleteDocument(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this document?")) return

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" })
    if (res.ok) {
      setDocuments((docs) => docs.filter((d) => d.id !== id))
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">CollabEdit</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session?.user?.name}</span>
            <Button variant="ghost" size="icon" title="Log out" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Button onClick={createDocument}>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Documents</h2>

        {documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-6">Create your first document to get started</p>
            <Button onClick={createDocument}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/editor/${doc.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base line-clamp-1">{doc.title}</CardTitle>
                    {doc.ownerId === session?.user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1 -mr-2"
                        onClick={(e) => deleteDocument(doc.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {doc.access.length + 1} collaborator{doc.access.length > 0 ? "s" : ""}
                      </span>
                    </div>
                    <Badge variant={doc.ownerId === session?.user?.id ? "default" : "secondary"}>
                      {doc.ownerId === session?.user?.id
                        ? "Owner"
                        : doc.access.find((a) => a.user.id === session?.user?.id)?.role || "Viewer"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
