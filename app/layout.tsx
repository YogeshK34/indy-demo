import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "./neo-brutal.css"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"
import { NavBar } from "@/components/nav-bar"
import { createClient } from "@/lib/supabase/server"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SSI Demo — Decentralized Identity",
  description:
    "A demonstration of Self-Sovereign Identity using DIDs and Verifiable Credentials, compared with traditional OAuth.",
}

import { connection } from "next/server"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable
      )}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <NavBar email={user?.email} />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-4">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
