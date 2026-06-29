import * as Y from "yjs"
// @ts-ignore
import { setPersistence } from "y-websocket/bin/utils"

// Configure persistence for y-websocket
export function setupPersistence() {
  setPersistence({
    bindState: async (docName: string, ydoc: Y.Doc) => {
      // Load initial state from the database via API
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/documents/${docName}/state`,
          {
            headers: {
              "X-Server-Secret": process.env.WS_SERVER_SECRET || "ws-internal-secret",
            },
          }
        )
        
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          if (buffer.byteLength > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(buffer))
          }
        }
      } catch (error) {
        console.error(`Failed to load document ${docName}:`, error)
      }

      // We don't need to listen to ydoc.on('update') here to save manually,
      // because y-websocket calls writeState() automatically on debounced intervals
      // when the document changes!
    },
    
    writeState: async (docName: string, ydoc: Y.Doc) => {
      // Persist the current state to the database
      try {
        const state = Y.encodeStateAsUpdate(ydoc)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/documents/${docName}/state`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/octet-stream",
              "X-Server-Secret": process.env.WS_SERVER_SECRET || "ws-internal-secret",
            },
            body: Buffer.from(state),
          }
        )
        if (!response.ok) {
          console.error(`Failed to persist document ${docName}: ${response.status}`)
        }
      } catch (error) {
        console.error(`Error persisting document ${docName}:`, error)
      }
    }
  })
}
