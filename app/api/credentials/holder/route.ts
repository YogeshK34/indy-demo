import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createJwtVP, decryptPrivateKey, signWithPrivateKey } from "@/lib/did"
import { isHolder } from "@/lib/roles"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isHolder(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get holder's DID
  const { data: didRecord } = await supabase
    .from("dids")
    .select("did")
    .eq("user_id", user.id)
    .single()

  if (!didRecord) {
    return NextResponse.json({ credentials: [], holderDid: null })
  }

  // Get all credentials for this holder
  const { data: credentials } = await supabase
    .from("credentials")
    .select("*")
    .eq("holder_did", didRecord.did)
    .order("issued_at", { ascending: false })

  return NextResponse.json({
    credentials: credentials ?? [],
    holderDid: didRecord.did,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isHolder(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { credentialId, action } = await request.json() as {
    credentialId?: string
    action?: string
  }

  const { data: didRecord } = await supabase
    .from("dids")
    .select("did, private_key_encrypted")
    .eq("user_id", user.id)
    .single()

  if (!didRecord) {
    return NextResponse.json({ error: "Holder DID not found" }, { status: 404 })
  }

  const privateKeyHex = await decryptPrivateKey(
    didRecord.private_key_encrypted,
    user.id
  )

  // Prove ownership — sign a challenge
  if (action === "prove-ownership") {
    const challenge = `SSI-DEMO-OWNERSHIP-PROOF:${Date.now()}`
    const signature = await signWithPrivateKey(challenge, privateKeyHex)
    return NextResponse.json({ challenge, signature, did: didRecord.did })
  }

  // Create Verifiable Presentation
  if (!credentialId) {
    return NextResponse.json({ error: "credentialId required" }, { status: 400 })
  }

  const { data: credential } = await supabase
    .from("credentials")
    .select("jwt_vc, holder_did")
    .eq("id", credentialId)
    .eq("holder_did", didRecord.did)
    .single()

  if (!credential) {
    return NextResponse.json(
      { error: "Credential not found or not yours" },
      { status: 404 }
    )
  }

  const jwtVp = await createJwtVP({
    holderDid: didRecord.did,
    jwtVc: credential.jwt_vc,
    privateKeyHex,
  })

  // Store presentation
  const { data: presentation } = await supabase
    .from("presentations")
    .insert({
      holder_did: didRecord.did,
      jwt_vp: jwtVp,
      verified: false,
    })
    .select()
    .single()

  return NextResponse.json({
    jwtVp,
    presentationId: presentation?.id,
  })
}
