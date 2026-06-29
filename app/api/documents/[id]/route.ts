import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db/prisma"
import { authorizeDocumentAccess } from "@/lib/auth/authorize"
import { Role } from "@/lib/types"
import { z } from "zod"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { allowed } = await authorizeDocumentAccess(session.user.id, id)

  if (!allowed) {
    return Response.json({ error: "Access denied" }, { status: 403 })
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      access: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!document) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(document)
}

const updateSchema = z.object({
  title: z.string().min(1).max(255),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { allowed } = await authorizeDocumentAccess(session.user.id, id, [Role.OWNER, Role.EDITOR])

  if (!allowed) {
    return Response.json({ error: "Access denied" }, { status: 403 })
  }

  const body = await request.json()
  const { title } = updateSchema.parse(body)

  const document = await prisma.document.update({
    where: { id },
    data: { title },
  })

  return Response.json(document)
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
    return Response.json({ error: "Only the owner can delete a document" }, { status: 403 })
  }

  await prisma.document.delete({ where: { id } })

  return Response.json({ success: true })
}
