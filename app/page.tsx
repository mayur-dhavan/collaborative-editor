import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Users, Zap, Shield } from "lucide-react"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/documents")
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">CollabEdit</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-white/5">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-20 pb-32 text-center">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
          Next-Gen Collaboration
        </Badge>
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
          Write together, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            at the speed of thought.
          </span>
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          A premium, local-first collaborative editor with real-time sync, offline support, and AI-powered writing assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 hover:shadow-primary/30">
              Start for free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full text-left">
          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Sync</h3>
            <p className="text-muted-foreground leading-relaxed">Experience instant updates with conflict-free collaborative editing powered by Yjs.</p>
          </div>
          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multiplayer</h3>
            <p className="text-muted-foreground leading-relaxed">Work with your team simultaneously with live presence and collaborative carets.</p>
          </div>
          <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
              <Shield className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Local</h3>
            <p className="text-muted-foreground leading-relaxed">Your data stays yours. Local-first architecture ensures offline access and security.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {children}
    </span>
  )
}
