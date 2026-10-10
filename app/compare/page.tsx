import { connection } from "next/server"
export const instant = false
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OAuthDataLog } from "@/types"

export default async function ComparePage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let oauthLog: OAuthDataLog | null = null
  let userDid: string | null = null
  let userPublicKey: string | null = null

  if (user) {
    const { data: log } = await supabase
      .from("oauth_data_log")
      .select("*")
      .eq("user_id", user.id)
      .single<OAuthDataLog>()
    oauthLog = log

    const { data: didRecord } = await supabase
      .from("dids")
      .select("did, public_key_base58")
      .eq("user_id", user.id)
      .single()

    userDid = didRecord?.did ?? null
    userPublicKey = didRecord?.public_key_base58 ?? null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-[900] tracking-[-0.04em] uppercase">IDENTITY: THEN VS NOW</h1>
        <hr className="border-t-2 border-black mt-4 mb-8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: OAUTH */}
        <Card className="border-l-[6px] border-l-[#FF2D2D] rounded-none">
          <CardHeader>
            <CardTitle className="font-[800] uppercase tracking-tight">OAUTH (LEGACY)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Email</p>
                <p>{oauthLog?.email || "—"}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Full Name</p>
                <p>{oauthLog?.full_name || "—"}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Provider ID</p>
                <p className="break-all">{oauthLog?.provider_id || "—"}</p>
              </div>
            </div>
            <div className="pt-6 border-t-2 border-black">
              <p className="font-mono text-xs text-muted-foreground uppercase mb-2">WHO CONTROLS THIS?</p>
              <p className="text-xl font-bold">Google + this app</p>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: SSI */}
        <Card className="border-l-[6px] border-l-[#00C853] rounded-none">
          <CardHeader>
            <CardTitle className="font-[800] uppercase tracking-tight">SSI (SELF-SOVEREIGN)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase mb-1">DID</p>
                <p className="break-all font-mono text-sm">{userDid || "—"}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Public Key</p>
                <p className="break-all font-mono text-sm">{userPublicKey || "—"}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase mb-1">PII Stored</p>
                <p>None</p>
              </div>
            </div>
            <div className="pt-6 border-t-2 border-black">
              <p className="font-mono text-xs text-muted-foreground uppercase mb-2">WHO CONTROLS THIS?</p>
              <p className="text-xl font-bold">Only you</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
