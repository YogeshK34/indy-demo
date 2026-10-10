import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { resolveDidKey } from "@/lib/did"
import { anchorDidOnCheqd } from "@/lib/cheqd"
import { isIssuer } from "@/lib/roles"
import type { DIDDocument } from "@/types"

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
      { error: "Only the Issuer account can anchor DIDs on Cheqd" },
      { status: 403 }
    )
  }

  const { data: didRecord } = await supabase
    .from("dids")
    .select("did, cheqd_anchored")
    .eq("user_id", user.id)
    .single()

  if (!didRecord) {
    return NextResponse.json(
      { error: "No DID found. Generate a DID first." },
      { status: 404 }
    )
  }

  if (didRecord.cheqd_anchored) {
    return NextResponse.json(
      { error: "DID is already anchored on Cheqd" },
      { status: 409 }
    )
  }

  const didDocument = resolveDidKey(didRecord.did) as DIDDocument

  const { txHash, success, error: anchorError } = await anchorDidOnCheqd(didDocument)

  if (!success) {
    return NextResponse.json(
      { error: anchorError ?? "Failed to anchor DID on Cheqd" },
      { status: 500 }
    )
  }

  await supabase
    .from("dids")
    .update({ cheqd_anchored: true, cheqd_tx_hash: txHash })
    .eq("user_id", user.id)

  return NextResponse.json({ success: true, txHash })
}
