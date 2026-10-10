import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createJwtVC, decryptPrivateKey } from "@/lib/did"
import { isIssuer } from "@/lib/roles"
import { z } from "zod"

const IssueSchema = z.object({
  credentialType: z.string().min(1),
  holderDid: z.string().startsWith("did:"),
  subject: z.object({
    fullName: z.string().min(1),
    degree: z.string().min(1),
    institution: z.string().min(1),
    graduationYear: z.number().int().min(1900).max(2100),
    cgpa: z.number().min(0).max(10),
  }),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isIssuer(user.email)) {
    return NextResponse.json(
      { error: "Only the Issuer account can issue credentials" },
      { status: 403 }
    )
  }

  const body = await request.json() as unknown
  const parsed = IssueSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { credentialType, holderDid, subject } = parsed.data

  // Fetch issuer's DID and encrypted private key
  const { data: didRecord, error: didError } = await supabase
    .from("dids")
    .select("did, private_key_encrypted")
    .eq("user_id", user.id)
    .single()

  if (didError || !didRecord) {
    return NextResponse.json(
      { error: "Issuer DID not found. Generate a DID first." },
      { status: 404 }
    )
  }

  // Decrypt private key server-side
  const privateKeyHex = await decryptPrivateKey(
    didRecord.private_key_encrypted,
    user.id
  )

  // Build and sign the JWT-VC
  const jwtVc = await createJwtVC({
    issuerDid: didRecord.did,
    holderDid,
    credentialType,
    credentialSubject: subject,
    privateKeyHex,
  })

  // Decode to extract payload for storage
  const payloadB64 = jwtVc.split(".")[1]
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString())

  // Store in credentials table
  const { data: credential, error: insertError } = await supabase
    .from("credentials")
    .insert({
      issuer_did: didRecord.did,
      holder_did: holderDid,
      credential_type: credentialType,
      credential_subject: subject,
      jwt_vc: jwtVc,
      issued_at: new Date(payload.nbf * 1000).toISOString(),
      expires_at: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : null,
      status: "active",
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: credential.id,
    jwtVc,
    decodedPayload: payload,
    issuerDid: didRecord.did,
    holderDid,
    credentialType,
  })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isIssuer(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: didRecord } = await supabase
    .from("dids")
    .select("did")
    .eq("user_id", user.id)
    .single()

  if (!didRecord) {
    return NextResponse.json({ credentials: [], issuerDid: null })
  }

  const { data: credentials } = await supabase
    .from("credentials")
    .select("*")
    .eq("issuer_did", didRecord.did)
    .order("issued_at", { ascending: false })

  return NextResponse.json({ credentials: credentials ?? [], issuerDid: didRecord.did })
}
