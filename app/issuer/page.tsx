import { connection } from "next/server"
export const instant = false
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isIssuer } from "@/lib/roles"
import { IssuerDashboardClient } from "./issuer-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

export default async function IssuerPage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) redirect("/login")

  if (!isIssuer(user.email)) {
    return (
      <main className="container max-w-3xl mx-auto px-4 py-10">
        <Alert variant="destructive">
          <ShieldX className="size-4" />
          <AlertDescription>
            This page is restricted to the Issuer account (
            <code>{process.env.ISSUER_EMAIL}</code>). You are logged in as{" "}
            <strong>{user.email}</strong>.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[900] tracking-[-0.04em] uppercase">ISSUE A CREDENTIAL</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          Issue Verifiable Credentials to Holders. All credentials are signed
          with your Ed25519 private key using the JWT-VC format (W3C standard).
        </p>
        <hr className="border-t-2 border-black mt-4 mb-8" />
      </div>

      <IssuerDashboardClient />
    </div>
  )
}
