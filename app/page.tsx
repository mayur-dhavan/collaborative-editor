import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/documents")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">CollabEdit</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full px-6">
        <div className="py-24 md:py-32">
          <p className="text-sm font-medium text-muted-foreground mb-4 tracking-wide uppercase">
            Local-first collaborative editing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
            Write together without the lag.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            A document editor that works offline, syncs in real-time, and never loses your work. Built on CRDTs for conflict-free collaboration.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/register">
              <Button size="lg">
                Start writing <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                I have an account
              </Button>
            </Link>
          </div>

          <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-8 border-t pt-12">
            <div>
              <p className="text-sm font-semibold text-foreground">Offline-first</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Edits persist to IndexedDB immediately. Network is optional, not required.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Real-time sync</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Yjs CRDTs merge concurrent edits without conflicts. See collaborators live.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Version history</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Snapshot any state and restore it later. Full audit trail of every change.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
