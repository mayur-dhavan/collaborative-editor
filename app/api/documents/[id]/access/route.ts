import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { Role } from "@/lib/types"

const SERVER_SECRET = process.env.WS_SERVER_SECRET || "ws-internal-secret"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isServerCall = request.headers.get("X-Server-Secret") === SERVER_SECRET
  if (!isServerCall) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = request.nextUrl.searchParams.get("userId")

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 })
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: { ownerId: true },
  })

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  if (document.ownerId === userId) {
    return Response.json({ role: Role.OWNER })
  }

  const access = await prisma.documentAccess.findUnique({
    where: { documentId_userId: { documentId: id, userId } },
  })

  if (!access) {
    return Response.json({ error: "Access denied" }, { status: 403 })
  }

  return Response.json({ role: access.role })
}
