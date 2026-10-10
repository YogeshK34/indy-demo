import { connection } from "next/server"
export const instant = false
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isVerifier } from "@/lib/roles"
import { VerifierDashboardClient } from "./verifier-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

export default async function VerifierPage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) redirect("/login")

  if (!isVerifier(user.email)) {
    return (
      <main className="container max-w-3xl mx-auto px-4 py-10">
        <Alert variant="destructive">
          <ShieldX className="size-4" />
          <AlertDescription>
            This page is restricted to the Verifier account (
            <code>{process.env.VERIFIER_EMAIL}</code>). You are logged in as{" "}
            <strong>{user.email}</strong>.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[900] tracking-[-0.04em] uppercase">VERIFY A CREDENTIAL</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          Verify Verifiable Presentations received from the Holder. No contact
          with the Issuer is needed — verification is fully cryptographic.
        </p>
        <hr className="border-t-2 border-black mt-4 mb-8" />
      </div>

      <VerifierDashboardClient />
    </div>
  )
}
