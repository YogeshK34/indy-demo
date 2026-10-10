import { connection } from "next/server"
export const instant = false
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isIssuer } from "@/lib/roles"
import { DIDPageClient } from "./did-client"

export default async function DIDPage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) redirect("/login")

  const userIsIssuer = isIssuer(user.email)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[900] tracking-[-0.04em] uppercase">YOUR DECENTRALIZED IDENTITY</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          Generate and manage your decentralized identifier (DID) and Ed25519 keypair.
        </p>
        <hr className="border-t-2 border-black mt-4 mb-8" />
      </div>

      <DIDPageClient isIssuer={userIsIssuer} />
    </div>
  )
}
