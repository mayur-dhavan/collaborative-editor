import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { access: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      access: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return Response.json(documents)
}

const createSchema = z.object({
  title: z.string().min(1).max(255).optional(),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title } = createSchema.parse(body)

  const document = await prisma.document.create({
    data: {
      title: title || "Untitled Document",
      ownerId: session.user.id,
    },
  })

  return Response.json(document, { status: 201 })
}
