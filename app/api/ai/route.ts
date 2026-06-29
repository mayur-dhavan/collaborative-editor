import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "AI features require an OPENAI_API_KEY environment variable" },
      { status: 503 }
    )
  }

  const { action, documentId, context } = await request.json()

  let documentContent = ""
  if (documentId) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { title: true },
    })
    documentContent = doc?.title || ""
  }

  const prompts: Record<string, string> = {
    summarize: `Summarize the following document concisely in 2-3 paragraphs. Focus on key points:\n\n${documentContent}`,
    improve: `Improve the writing quality of the following text. Make it clearer, more engaging, and professional. Return only the improved text:\n\n${documentContent}`,
    grammar: `Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n${documentContent}`,
    expand: `Expand on the following text with more detail, examples, and explanations. Return the expanded version:\n\n${documentContent}`,
    translate: `Translate the following text to ${context?.targetLanguage || "Spanish"}. Return only the translation:\n\n${documentContent}`,
  }

  const prompt = prompts[action]
  if (!prompt) {
    return Response.json({ error: "Invalid action" }, { status: 400 })
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    prompt,
    temperature: 0.7,
  })

  return result.toTextStreamResponse()
}
