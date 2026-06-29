import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"

const SERVER_SECRET = process.env.WS_SERVER_SECRET || "ws-internal-secret"

function verifyServerSecret(request: NextRequest): boolean {
  return request.headers.get("X-Server-Secret") === SERVER_SECRET
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyServerSecret(request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await params
  const document = await prisma.document.findUnique({
    where: { id },
    select: { yjsState: true },
  })

  if (!document) {
    return new Response("Not found", { status: 404 })
  }

  if (!document.yjsState) {
    return new Response(new ArrayBuffer(0), {
      headers: { "Content-Type": "application/octet-stream" },
    })
  }

  return new Response(document.yjsState, {
    headers: { "Content-Type": "application/octet-stream" },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyServerSecret(request)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await params
  const buffer = await request.arrayBuffer()

  await prisma.document.update({
    where: { id },
    data: { yjsState: Buffer.from(buffer) },
  })

  return Response.json({ success: true })
}
