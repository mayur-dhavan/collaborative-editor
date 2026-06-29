import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db/prisma"
import { authorizeDocumentAccess } from "@/lib/auth/authorize"
import { Role } from "@/lib/types"
import { z } from "zod"

const shareSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { allowed } = await authorizeDocumentAccess(session.user.id, id, [Role.OWNER])

  if (!allowed) {
    return Response.json({ error: "Only the owner can share this document" }, { status: 403 })
  }

  const body = await request.json()
  const { email, role } = shareSchema.parse(body)

  const targetUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  if (targetUser.id === session.user.id) {
    return Response.json({ error: "Cannot share with yourself" }, { status: 400 })
  }

  const access = await prisma.documentAccess.upsert({
    where: {
      documentId_userId: { documentId: id, userId: targetUser.id },
    },
    update: { role: role as Role },
    create: {
      documentId: id,
      userId: targetUser.id,
      role: role as Role,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return Response.json(access, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { allowed } = await authorizeDocumentAccess(session.user.id, id, [Role.OWNER])

  if (!allowed) {
    return Response.json({ error: "Only the owner can manage sharing" }, { status: 403 })
  }

  const { userId } = await request.json()

  await prisma.documentAccess.delete({
    where: { documentId_userId: { documentId: id, userId } },
  })

  return Response.json({ success: true })
}
