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
        <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
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
        setWsToken("offline-token")
      }
    } catch (e) {
      console.warn("Offline: Failed to fetch WS token. Proceeding to offline mode.")
      setWsToken("offline-token")
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
        <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 z-20 bg-background">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-full">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/documents")}
              aria-label="Back to documents"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => updateTitle(e.target.value)}
              className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 min-w-0 truncate max-w-xs sm:max-w-sm md:max-w-md"
              disabled={userRole === "VIEWER"}
              aria-label="Document title"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowAI(!showAI); setShowHistory(false) }}
              aria-pressed={showAI}
              className={showAI ? "bg-accent" : ""}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">AI</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowHistory(!showHistory); setShowAI(false) }}
              aria-pressed={showHistory}
              className={showHistory ? "bg-accent" : ""}
            >
              <History className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">History</span>
            </Button>
            {userRole === "OWNER" && (
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                <Share2 className="h-4 w-4 mr-1.5" />
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
          <aside className="w-72 border-l overflow-y-auto bg-background shrink-0">
            <VersionHistory documentId={id} onClose={() => setShowHistory(false)} />
          </aside>
        )}

        {showAI && (
          <aside className="w-72 border-l overflow-y-auto bg-background shrink-0">
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
