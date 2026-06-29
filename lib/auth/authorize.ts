import { prisma } from "@/lib/db/prisma"
import { Role } from "@/lib/types"

export async function authorizeDocumentAccess(
  userId: string,
  documentId: string,
  requiredRoles: Role[] = [Role.OWNER, Role.EDITOR, Role.VIEWER]
): Promise<{ allowed: boolean; role: Role | null }> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  })

  if (!document) {
    return { allowed: false, role: null }
  }

  if (document.ownerId === userId) {
    if (requiredRoles.includes(Role.OWNER)) {
      return { allowed: true, role: Role.OWNER }
    }
    return { allowed: false, role: Role.OWNER }
  }

  const access = await prisma.documentAccess.findUnique({
    where: {
      documentId_userId: { documentId, userId },
    },
  })

  if (!access) {
    return { allowed: false, role: null }
  }

  if (requiredRoles.includes(access.role)) {
    return { allowed: true, role: access.role }
  }

  return { allowed: false, role: access.role }
}
