"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent } from "@tiptap/react"
import { Editor } from "@tiptap/core"
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
import { SyncStateManager, SyncStatus } from "@/lib/crdt/sync-engine"
import { useSyncState } from "@/hooks/use-sync-state"
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
  const [editor, setEditor] = useState<Editor | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [syncManager] = useState(() => new SyncStateManager())
  const syncStatus = useSyncState(syncManager)

  // Single ref to track cleanup — prevents double-init in React 18 Strict Mode
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // If a cleanup already exists (Strict Mode second run), tear down first
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    const ydoc = new Y.Doc()
    const fragment = ydoc.getXmlFragment("document")

    const persistence = new IndexeddbPersistence(`doc-${documentId}`, ydoc)

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000"
    const ws = new WebsocketProvider(wsUrl, documentId, ydoc, {
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

    // Build extensions array once — fragment is guaranteed valid here
    const extensions: any[] = [
      StarterKit.configure({ undoRedo: false, underline: false }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your document..." }),
      Collaboration.configure({ fragment }),
      CollaborationCursor.configure({
        provider: ws,
        user: { name: userName, color: getUserColor(userId) },
      }),
    ]

    // Create TipTap Editor directly — no hook, no re-creation on re-render
    const tiptapEditor = new Editor({
      extensions,
      editable: !readOnly,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6",
        },
      },
    })

    setEditor(tiptapEditor)
    setProvider(ws)

    cleanupRef.current = () => {
      tiptapEditor.destroy()
      ws.destroy()
      persistence.destroy()
      ydoc.destroy()
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [documentId])

  if (!editor) {
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <EditorToolbar editor={editor} readOnly={readOnly} />
        </div>
        <div className="flex items-center gap-3">
          <ActiveUsers provider={provider} />
          <ConnectionStatus status={syncStatus} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="max-w-4xl mx-auto" />
      </div>
    </div>
  )
}
