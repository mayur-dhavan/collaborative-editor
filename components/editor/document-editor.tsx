"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"
import { WebsocketProvider } from "y-websocket"
import { useSyncState } from "@/hooks/use-sync-state"
import { SyncStateManager } from "@/lib/crdt/sync-engine"
import { getUserColor } from "@/lib/crdt/ydoc-manager"
import { EditorToolbar } from "./toolbar"
import { ConnectionStatus } from "@/components/collaboration/connection-status"
import { ActiveUsers } from "@/components/collaboration/active-users"

interface DocumentEditorProps {
  documentId: string
  userId: string
  userName: string
  token: string
  readOnly?: boolean
}

export function DocumentEditor({
  documentId,
  userId,
  userName,
  token,
  readOnly = false,
}: DocumentEditorProps) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [syncManager] = useState(() => new SyncStateManager())
  const [isReady, setIsReady] = useState(false)
  const syncStatus = useSyncState(syncManager)

  useEffect(() => {
    const doc = new Y.Doc()
    const persistence = new IndexeddbPersistence(`doc-${documentId}`, doc)

    persistence.once("synced", () => {
      setYdoc(doc)

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000"
      const ws = new WebsocketProvider(wsUrl, documentId, doc, {
        params: { token, userId },
      })

      ws.awareness.setLocalStateField("user", {
        name: userName,
        color: getUserColor(userId),
      })

      ws.on("status", ({ status }: { status: string }) => {
        if (status === "connected") syncManager.setStatus("synced")
        else if (status === "connecting") syncManager.setStatus("connecting")
        else syncManager.setStatus("offline")
      })

      setProvider(ws)
      setIsReady(true)
    })

    return () => {
      provider?.destroy()
      persistence.destroy()
      doc.destroy()
    }
  }, [documentId])

  if (!isReady || !ydoc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <EditorView
      ydoc={ydoc}
      provider={provider}
      documentId={documentId}
      userId={userId}
      userName={userName}
      readOnly={readOnly}
      syncStatus={syncStatus}
    />
  )
}

interface EditorViewProps {
  ydoc: Y.Doc
  provider: WebsocketProvider | null
  documentId: string
  userId: string
  userName: string
  readOnly: boolean
  syncStatus: string
}

function EditorView({
  ydoc,
  provider,
  documentId,
  userId,
  userName,
  readOnly,
  syncStatus,
}: EditorViewProps) {
  const extensions = useMemo(() => {
    const exts: any[] = [
      StarterKit.configure({
        undoRedo: false,
        underline: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Start writing your document...",
      }),
      Collaboration.configure({
        document: ydoc,
        field: "document",
      }),
    ]

    if (provider) {
      exts.push(
        CollaborationCursor.configure({
          provider,
          user: {
            name: userName,
            color: getUserColor(userId),
          },
        })
      )
    }

    return exts
  }, [ydoc, provider, userName, userId])

  const editor = useEditor({
    extensions,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6",
      },
    },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {editor && <EditorToolbar editor={editor} readOnly={readOnly} />}
        </div>
        <div className="flex items-center gap-3">
          <ActiveUsers provider={provider} />
          <ConnectionStatus status={syncStatus as any} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="max-w-4xl mx-auto" />
      </div>
    </div>
  )
}
