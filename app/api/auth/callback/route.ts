import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Log OAuth data to our database
      const user = data.user
      const identities = user.identities ?? []
      const googleIdentity = identities.find((i) => i.provider === "google")
      const meta = user.user_metadata ?? {}

      // Upsert oauth_data_log
      await supabase.from("oauth_data_log").upsert(
        {
          user_id: user.id,
          email: user.email ?? "",
          full_name: meta.full_name ?? meta.name ?? null,
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
          provider: "google",
          provider_id: googleIdentity?.id ?? user.id,
          scopes_granted: ["openid", "email", "profile"],
          raw_user_meta: meta,
        },
        { onConflict: "user_id" }
      )
    }
  }

  return NextResponse.redirect(`${origin}/oauth-inspector`)
}
