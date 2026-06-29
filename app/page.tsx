import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Users, Zap, Shield, ArrowRight } from "lucide-react"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/documents")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">CollabEdit</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block">
              Sign In
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center relative z-10 px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-6">
            Assignment 2 - Local-First Architecture
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Write together, <br className="hidden sm:block" />
            <span className="text-muted-foreground">at the speed of thought.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            A secure, local-first collaborative editor with real-time synchronization, deterministic conflict resolution, and granular version control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                Start Editing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                Sign In to existing account
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="flex flex-col items-start">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Experience instant updates with conflict-free collaborative editing powered by Yjs. Work together without overwriting each other.
              </p>
            </div>
            <div className="flex flex-col items-start">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Local-First Engine</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Offline support via IndexedDB. Open, edit, and close documents with zero network requests blocking the UI.
              </p>
            </div>
            <div className="flex flex-col items-start">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Strict Owner, Editor, and Viewer permissions. End-to-end security ensures users only access what they are authorized to see.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
