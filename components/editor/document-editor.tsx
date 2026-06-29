"use client"

import { useEffect, useRef, useState } from "react"
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
  const [syncManager] = useState(() => new SyncStateManager())
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [isReady, setIsReady] = useState(false)
  const syncStatus = useSyncState(syncManager)

  const ydocRef = useRef<Y.Doc | null>(null)
  const fragmentRef = useRef<Y.XmlFragment | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)

  useEffect(() => {
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const fragment = ydoc.getXmlFragment("document")
    fragmentRef.current = fragment

    const persistence = new IndexeddbPersistence(`doc-${documentId}`, ydoc)
    persistenceRef.current = persistence

    persistence.once("synced", () => {
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

      providerRef.current = ws
      setProvider(ws)
      setIsReady(true)
    })

    return () => {
      providerRef.current?.destroy()
      persistenceRef.current?.destroy()
      ydocRef.current?.destroy()
    }
  }, [documentId])

  if (!isReady || !fragmentRef.current) {
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
    <CollaborativeEditor
      fragment={fragmentRef.current}
      provider={provider}
      userId={userId}
      userName={userName}
      readOnly={readOnly}
      syncStatus={syncStatus}
    />
  )
}

interface CollaborativeEditorProps {
  fragment: Y.XmlFragment
  provider: WebsocketProvider | null
  userId: string
  userName: string
  readOnly: boolean
  syncStatus: SyncStatus
}

function CollaborativeEditor({
  fragment,
  provider,
  userId,
  userName,
  readOnly,
  syncStatus,
}: CollaborativeEditorProps) {
  const editor = useEditor({
    extensions: [
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
        fragment,
      }),
      ...(provider
        ? [
            CollaborationCursor.configure({
              provider,
              user: {
                name: userName,
                color: getUserColor(userId),
              },
            }),
          ]
        : []),
    ],
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
          <ConnectionStatus status={syncStatus} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="max-w-4xl mx-auto" />
      </div>
    </div>
  )
}
