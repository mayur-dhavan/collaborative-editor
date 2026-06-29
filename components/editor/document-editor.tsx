"use client"

import { useEffect, useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import { YDocManager, getUserColor } from "@/lib/crdt/ydoc-manager"
import { SyncStatus } from "@/lib/crdt/sync-engine"
import { useSyncState } from "@/hooks/use-sync-state"
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
  const [ydocManager, setYdocManager] = useState<YDocManager | null>(null)
  const [isReady, setIsReady] = useState(false)
  const syncStatus = useSyncState(ydocManager?.syncState || null)

  useEffect(() => {
    const manager = new YDocManager({
      documentId,
      userId,
      userName,
      userColor: getUserColor(userId),
      token,
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000",
    })

    manager.initialize().then(() => {
      setYdocManager(manager)
      setIsReady(true)
    })

    return () => {
      manager.destroy()
    }
  }, [documentId, userId, userName, token])

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false,
        }),
        Underline,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Placeholder.configure({
          placeholder: "Start writing your document...",
        }),
        ...(isReady && ydocManager
          ? [
              Collaboration.configure({
                document: ydocManager.ydoc,
                field: "document",
              }),
              ...(ydocManager.getProvider()
                ? [
                    CollaborationCursor.configure({
                      provider: ydocManager.getProvider()!,
                      user: {
                        name: userName,
                        color: getUserColor(userId),
                      },
                    }),
                  ]
                : []),
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
    },
    [isReady, ydocManager]
  )

  const handleCreateSnapshot = useCallback(async () => {
    if (!ydocManager) return
    const snapshot = await ydocManager.createSnapshot()
    const stateVector = await ydocManager.getStateVector()

    await fetch(`/api/documents/${documentId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        snapshot: Buffer.from(snapshot).toString("base64"),
        stateVector: Buffer.from(stateVector).toString("base64"),
        label: `Manual snapshot`,
      }),
    })
  }, [ydocManager, documentId])

  if (!isReady) {
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
          {editor && <EditorToolbar editor={editor} readOnly={readOnly} />}
        </div>
        <div className="flex items-center gap-3">
          <ActiveUsers provider={ydocManager?.getProvider() || null} />
          <ConnectionStatus status={syncStatus} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="max-w-4xl mx-auto" />
      </div>
    </div>
  )
}
