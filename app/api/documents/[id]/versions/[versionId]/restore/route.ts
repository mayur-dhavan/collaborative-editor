import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db/prisma"
import { authorizeDocumentAccess } from "@/lib/auth/authorize"
import { Role } from "@/lib/types"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, versionId } = await params
  const { allowed } = await authorizeDocumentAccess(session.user.id, id, [Role.OWNER, Role.EDITOR])

  if (!allowed) {
    return Response.json({ error: "Access denied" }, { status: 403 })
  }

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId, documentId: id },
  })

  if (!version) {
    return Response.json({ error: "Version not found" }, { status: 404 })
  }

  // Store the snapshot as the document's current Yjs state
  // The CRDT will handle merge when clients reconnect
  await prisma.document.update({
    where: { id },
    data: { yjsState: version.yjsSnapshot },
  })

  return Response.json({ success: true, restoredVersionId: versionId })
}
