"use client"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, History, Sparkles } from "lucide-react"
import { ShareDialog } from "@/components/editor/share-dialog"
import { VersionHistory } from "@/components/version-history/timeline"
import { AISidebar } from "@/components/editor/ai-sidebar"

const DocumentEditor = dynamic(
  () => import("@/components/editor/document-editor").then((mod) => ({ default: mod.DocumentEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

interface Document {
  id: string
  title: string
  ownerId: string
  owner: { id: string; name: string }
  access: { role: string; user: { id: string; name: string; email: string } }[]
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState("")
  const [showShare, setShowShare] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [userRole, setUserRole] = useState<string>("VIEWER")
  const [wsToken, setWsToken] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocument()
      fetchWsToken()
    }
  }, [status, id])

  async function fetchWsToken() {
    try {
      const res = await fetch("/api/auth/ws-token")
      if (res.ok) {
        const data = await res.json()
        setWsToken(data.token)
      } else {
        // If fetch fails but we're online, token might be invalid
        setWsToken("offline-token")
      }
    } catch (e) {
      console.warn("Offline: Failed to fetch WS token. Proceeding to offline mode.")
      setWsToken("offline-token") // Allow editor to boot in offline mode
    }
  }

  async function fetchDocument() {
    try {
      const res = await fetch(`/api/documents/${id}`)
      if (res.ok) {
        const doc = await res.json()
        setDocument(doc)
        setTitle(doc.title)
        
        let role = "VIEWER"
        if (doc.ownerId === session?.user?.id) {
          role = "OWNER"
        } else {
          const access = doc.access.find((a: { user: { id: string } }) => a.user.id === session?.user?.id)
          role = access?.role || "VIEWER"
        }
        setUserRole(role)
        
        // Cache metadata for offline use
        localStorage.setItem(`doc-meta-${id}`, JSON.stringify({ doc, role }))
      } else {
        router.push("/documents")
      }
    } catch (e) {
      console.warn("Offline: Failed to fetch document. Loading from local cache.")
      const cached = localStorage.getItem(`doc-meta-${id}`)
      if (cached) {
        const { doc, role } = JSON.parse(cached)
        setDocument(doc)
        setTitle(doc.title)
        setUserRole(role)
      } else {
        // If no cache, we have to redirect as we don't even have basic metadata
        router.push("/documents")
      }
    }
  }

  async function updateTitle(newTitle: string) {
    setTitle(newTitle)
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    })
  }

  if (status === "loading" || !document || !session || !wsToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/documents")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => updateTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 w-auto"
              disabled={userRole === "VIEWER"}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAI(!showAI)}>
              <Sparkles className="h-4 w-4 mr-1" />
              AI
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
            {userRole === "OWNER" && (
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <DocumentEditor
            documentId={id}
            userId={session.user.id}
            userName={session.user.name || "Anonymous"}
            token={wsToken}
            readOnly={userRole === "VIEWER"}
          />
        </main>

        {showHistory && (
          <aside className="w-80 border-l overflow-y-auto bg-background">
            <VersionHistory documentId={id} onClose={() => setShowHistory(false)} />
          </aside>
        )}

        {showAI && (
          <aside className="w-80 border-l overflow-y-auto bg-background">
            <AISidebar documentId={id} onClose={() => setShowAI(false)} />
          </aside>
        )}
      </div>

      {showShare && (
        <ShareDialog
          documentId={id}
          currentAccess={document.access}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
