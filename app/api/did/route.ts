import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { generateDidKey, encryptPrivateKey, resolveDidKey } from "@/lib/did"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user already has a DID
  const { data: existing } = await supabase
    .from("dids")
    .select("id, did")
    .eq("user_id", user.id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "DID already exists for this user", did: existing.did },
      { status: 409 }
    )
  }

  // Generate new DID
  const { did, publicKeyBase58, privateKeyHex } = await generateDidKey()

  // Encrypt private key before storing
  const privateKeyEncrypted = await encryptPrivateKey(privateKeyHex, user.id)

  // Store in database
  const { data, error } = await supabase
    .from("dids")
    .insert({
      user_id: user.id,
      did,
      public_key_base58: publicKeyBase58,
      private_key_encrypted: privateKeyEncrypted,
      method: "key",
      cheqd_anchored: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const didDocument = resolveDidKey(did)

  return NextResponse.json({
    did: data.did,
    publicKeyBase58: data.public_key_base58,
    didDocument,
    createdAt: data.created_at,
  })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("dids")
    .select("did, public_key_base58, cheqd_anchored, cheqd_tx_hash, created_at")
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ did: null })
  }

  const didDocument = resolveDidKey(data.did)

  return NextResponse.json({
    did: data.did,
    publicKeyBase58: data.public_key_base58,
    cheqdAnchored: data.cheqd_anchored,
    cheqdTxHash: data.cheqd_tx_hash,
    didDocument,
    createdAt: data.created_at,
  })
}
