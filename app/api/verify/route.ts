import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyJwtVP } from "@/lib/did"
import { isVerifier } from "@/lib/roles"
import type { VerificationResult } from "@/types"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isVerifier(user.email)) {
    return NextResponse.json(
      { error: "Only the Verifier account can verify presentations" },
      { status: 403 }
    )
  }

  const { jwtVp } = await request.json() as { jwtVp?: string }

  if (!jwtVp?.trim()) {
    return NextResponse.json({ error: "JWT VP is required" }, { status: 400 })
  }

  // Get verifier's DID (optional — for logging purposes)
  const { data: verifierDidRecord } = await supabase
    .from("dids")
    .select("did")
    .eq("user_id", user.id)
    .single()

  const result: VerificationResult = await verifyJwtVP(jwtVp.trim())

  const overallValid =
    result.vcSignatureValid &&
    result.vpSignatureValid &&
    result.holderDidMatch &&
    result.notExpired &&
    !result.error

  // Store verification result
  await supabase.from("presentations").insert({
    holder_did: result.holderDid || "unknown",
    verifier_did: verifierDidRecord?.did ?? null,
    jwt_vp: jwtVp.trim(),
    verified: overallValid,
    verified_at: new Date().toISOString(),
    verification_result: result,
  })

  return NextResponse.json({
    valid: overallValid,
    result,
  })
}
