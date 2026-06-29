"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, Sparkles, FileText, Wand2, Languages, ArrowRight, Loader2 } from "lucide-react"

interface AISidebarProps {
  documentId: string
  onClose: () => void
}

const AI_ACTIONS = [
  { id: "summarize", label: "Summarize", icon: FileText, description: "Get a concise summary of the document" },
  { id: "improve", label: "Improve Writing", icon: Wand2, description: "Enhance clarity and style" },
  { id: "grammar", label: "Fix Grammar", icon: Sparkles, description: "Correct grammar and punctuation" },
  { id: "expand", label: "Expand", icon: ArrowRight, description: "Elaborate on selected text" },
  { id: "translate", label: "Translate", icon: Languages, description: "Translate to another language" },
] as const

export function AISidebar({ documentId, onClose }: AISidebarProps) {
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  async function handleAction(actionId: string) {
    setLoading(true)
    setActiveAction(actionId)
    setResult("")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionId,
          documentId,
          context: actionId === "translate" ? { targetLanguage: "Spanish" } : {},
        }),
      })

      if (!res.ok) {
        setResult("AI feature requires an API key. Add your OPENAI_API_KEY to .env")
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setResult("Failed to get response stream")
        setLoading(false)
        return
      }

      let text = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        text += chunk
        setResult(text)
      }
    } catch {
      setResult("Failed to connect to AI service")
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {AI_ACTIONS.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              disabled={loading}
              className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}
        </div>

        {(result || loading) && (
          <>
            <Separator />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {activeAction} result
                </span>
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{result || "Thinking..."}</p>
              </div>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  )
}
