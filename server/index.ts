import { createServer } from "http"
import { WebSocketServer, WebSocket } from "ws"
import { handleConnection } from "./ws-handler"
import { rooms } from "./rooms"

const PORT = parseInt(process.env.WS_PORT || "4000")

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok", rooms: rooms.size }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server: httpServer })

wss.on("connection", (ws: WebSocket, req) => {
  handleConnection(ws, req)
})

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
    if (ws.isAlive === false) {
      ws.terminate()
      return
    }
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on("close", () => {
  clearInterval(heartbeatInterval)
})

function gracefulShutdown() {
  console.log("Shutting down WebSocket server...")
  rooms.forEach((room) => room.persistNow())
  wss.close(() => {
    httpServer.close(() => {
      process.exit(0)
    })
  })
}

process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})
