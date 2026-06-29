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
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-white/10 transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">CollabEdit</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">{session?.user?.name}</span>
            <Button variant="ghost" size="icon" title="Log out" className="hover:bg-white/5" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Button onClick={createDocument} className="shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Your Documents</h2>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Create your first document to start collaborating with your team in real-time.</p>
            <Button onClick={createDocument} size="lg" className="shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
              <Plus className="h-5 w-5 mr-2" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-white/5 bg-white/5 backdrop-blur-lg"
                onClick={() => router.push(`/editor/${doc.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">{doc.title}</CardTitle>
                    {doc.ownerId === session?.user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => deleteDocument(doc.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center border border-background">
                          <Users className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground ml-1">
                        {doc.access.length + 1}
                      </span>
                    </div>
                    <Badge variant={doc.ownerId === session?.user?.id ? "default" : "secondary"} className={doc.ownerId === session?.user?.id ? "" : "bg-white/5 hover:bg-white/10 text-xs border-white/10"}>
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
