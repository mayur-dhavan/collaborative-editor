import { ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Built by <span className="font-medium text-foreground">Mayur D</span>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/MayurD"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/MayurD"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  )
}
