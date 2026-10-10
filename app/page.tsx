import { connection } from "next/server"
export const instant = false
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserRole } from "@/lib/roles"
import { Separator } from "@/components/ui/separator"
import {
  ShieldCheck,
  KeyRound,
  FileText,
  UserCheck,
  ClipboardCheck,
  GitCompare,
  LogIn,
} from "lucide-react"

export default async function HomePage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user?.email ? getUserRole(user.email) : null

  const navItems = [
    {
      href: "/oauth-inspector",
      icon: <ShieldCheck className="size-5" />,
      label: "OAuth Inspector",
      description: "See exactly what data Google OAuth stores about you",
      badge: null,
      requiresAuth: true,
    },
    {
      href: "/did",
      icon: <KeyRound className="size-5" />,
      label: "DID Management",
      description: "Generate your decentralized identifier (DID) and keypair",
      badge: null,
      requiresAuth: true,
    },
    {
      href: "/issuer",
      icon: <FileText className="size-5" />,
      label: "Issuer Dashboard",
      description: "Issue Verifiable Credentials to holders",
      badge: "issuer",
      requiresAuth: true,
    },
    {
      href: "/holder",
      icon: <UserCheck className="size-5" />,
      label: "Holder Dashboard",
      description: "View your credentials and create presentations",
      badge: "holder",
      requiresAuth: true,
    },
    {
      href: "/verifier",
      icon: <ClipboardCheck className="size-5" />,
      label: "Verifier Dashboard",
      description: "Verify presentations without contacting the issuer",
      badge: "verifier",
      requiresAuth: true,
    },
    {
      href: "/compare",
      icon: <GitCompare className="size-5" />,
      label: "OAuth vs SSI",
      description: "Side-by-side comparison: legacy vs decentralized identity",
      badge: null,
      requiresAuth: false,
    },
  ]

  return (
    <main className="flex-1 container max-w-5xl mx-auto px-4 py-4">
      <div className="space-y-4 text-center mb-6">
        <Badge variant="secondary" className="text-sm">
          Hyperledger / SSI Demo
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Self-Sovereign Identity
          <br />
          <span className="text-muted-foreground font-normal text-2xl">
            vs. Traditional OAuth
          </span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          A live demonstration of decentralized identity using DIDs and
          Verifiable Credentials, compared with Google OAuth — the identity
          system used by most apps today.
        </p>

        {user ? (
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1 px-3">
              <span className="size-2 rounded-full bg-green-500 inline-block" />
              {user.email}
            </Badge>
            {role && role !== "user" && (
              <Badge className="capitalize">{role}</Badge>
            )}
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              <LogIn className="mr-2 size-4" />
              Sign in with Google
            </Link>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item) => {
          const isRestricted =
            item.badge && role !== item.badge && user !== null
          const isUnauth = item.requiresAuth && !user

          return (
            <Card
              key={item.href}
              className={cn(
                "transition-all",
                isRestricted || isUnauth
                  ? "opacity-60"
                  : "hover:shadow-md cursor-pointer"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-muted">{item.icon}</div>
                  {item.badge && (
                    <Badge variant="secondary" className="capitalize text-xs">
                      {item.badge} only
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-2">
                  {isRestricted || isUnauth ? (
                    item.label
                  ) : (
                    <Link href={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                {isUnauth ? (
                  <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Login to access
                  </Link>
                ) : isRestricted ? (
                  <span className="text-xs text-muted-foreground">
                    Requires {item.badge} account
                  </span>
                ) : (
                  <Link href={item.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Open →
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
        <p>
          Built with{" "}
          <a
            href="https://nextjs.org"
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js
          </a>
          ,{" "}
          <a
            href="https://supabase.com"
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Supabase
          </a>
          , and{" "}
          <a
            href="https://cheqd.io"
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cheqd TestNet
          </a>
        </p>
        <p>DID Method: did:key · VC Format: W3C JWT · Ed25519 signatures</p>
      </div>
    </main>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}
