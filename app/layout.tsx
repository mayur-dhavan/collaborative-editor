import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabEdit - Real-time Collaborative Editor",
  description: "A local-first collaborative document editor with offline sync, real-time collaboration, and AI-powered writing assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex-1 flex flex-col min-h-screen">
            {children}
            <footer className="py-6 border-t mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2026 CollabEdit by Mayur Dhavan
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <a href="https://github.com/mayur-dhavan" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                  <a href="https://www.linkedin.com/in/mayur-dhavan/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
