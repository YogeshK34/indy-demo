/**
 * Cheqd TestNet REST API helpers
 * Uses Cheqd's REST API to anchor DID Documents on the testnet
 */

import type { DIDDocument } from "@/types"

const CHEQD_API_BASE = process.env.CHEQD_API_BASE_URL ?? "https://api.cheqd.network"

/**
 * Resolve a DID from Cheqd (or any Universal Resolver-compatible endpoint)
 */
export async function resolveCheqdDid(did: string): Promise<DIDDocument | null> {
  try {
    const res = await fetch(`${CHEQD_API_BASE}/1.0/identifiers/${encodeURIComponent(did)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json() as { didDocument?: DIDDocument }
    return data.didDocument ?? null
  } catch {
    return null
  }
}

/**
 * Anchor a did:key DID Document on Cheqd TestNet via the Cheqd REST API
 * 
 * NOTE: Full Cheqd DID anchoring requires signing a DID creation transaction 
 * with a Cheqd wallet key. For this demo, we call the Cheqd API's 
 * /1.0/did endpoint and return the tx hash.
 * 
 * In production, you would use the Cheqd SDK or REST API to:
 * 1. Build the MsgCreateDidDoc transaction
 * 2. Sign it with your Cheqd wallet key (from CHEQD_MNEMONIC)
 * 3. Broadcast it to the chain
 * 
 * Returns the transaction hash if successful.
 */
export async function anchorDidOnCheqd(
  didDocument: DIDDocument
): Promise<{ txHash: string; success: boolean; error?: string }> {
  try {
    // Cheqd REST API endpoint for creating DID Documents
    const res = await fetch(`${CHEQD_API_BASE}/1.0/did`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CHEQD_API_KEY ?? "",
      },
      body: JSON.stringify({
        didDocument,
        network: "testnet",
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return { txHash: "", success: false, error: errorText }
    }

    const data = await res.json() as { txHash?: string; jobId?: string }
    const txHash = data.txHash ?? data.jobId ?? "pending"
    return { txHash, success: true }
  } catch (err) {
    return {
      txHash: "",
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}
