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

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    select: {
      id: true,
      label: true,
      createdAt: true,
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return Response.json(versions)
}

const createVersionSchema = z.object({
  snapshot: z.string(),
  stateVector: z.string().optional(),
  label: z.string().optional(),
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
  const { allowed } = await authorizeDocumentAccess(session.user.id, id, [Role.OWNER, Role.EDITOR])

  if (!allowed) {
    return Response.json({ error: "Access denied" }, { status: 403 })
  }

  const body = await request.json()
  const { snapshot, stateVector, label } = createVersionSchema.parse(body)

  const version = await prisma.documentVersion.create({
    data: {
      documentId: id,
      yjsSnapshot: Buffer.from(snapshot, "base64"),
      stateVector: stateVector ? Buffer.from(stateVector, "base64") : null,
      label: label || `Version ${new Date().toLocaleString()}`,
      createdBy: session.user.id,
    },
  })

  return Response.json(version, { status: 201 })
}
