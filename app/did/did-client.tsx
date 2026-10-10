"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { KeyRound, RefreshCw, ExternalLink, Loader2, Anchor } from "lucide-react"
import type { DIDDocument } from "@/types"

interface DIDState {
  did: string | null
  publicKeyBase58: string | null
  cheqdAnchored: boolean
  cheqdTxHash: string | null
  didDocument: DIDDocument | null
  createdAt: string | null
}

interface DIDPageClientProps {
  isIssuer: boolean
}

export function DIDPageClient({ isIssuer }: DIDPageClientProps) {
  const [state, setState] = useState<DIDState>({
    did: null,
    publicKeyBase58: null,
    cheqdAnchored: false,
    cheqdTxHash: null,
    didDocument: null,
    createdAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [anchoring, setAnchoring] = useState(false)

  async function fetchDID() {
    setLoading(true)
    try {
      const res = await fetch("/api/did")
      const data = await res.json() as DIDState & { did: string | null }
      setState(data)
    } catch {
      toast.error("Failed to load DID")
    } finally {
      setLoading(false)
    }
  }

  async function generateDID() {
    setGenerating(true)
    try {
      const res = await fetch("/api/did", { method: "POST" })
      const data = await res.json() as DIDState

      if (!res.ok) {
        const err = data as unknown as { error: string }
        toast.error(err.error ?? "Failed to generate DID")
        return
      }

      setState(data)
      toast.success("DID generated successfully!")
    } catch {
      toast.error("Failed to generate DID")
    } finally {
      setGenerating(false)
    }
  }

  async function anchorOnCheqd() {
    setAnchoring(true)
    try {
      const res = await fetch("/api/did/anchor", { method: "POST" })
      const data = await res.json() as { success?: boolean; txHash?: string; error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to anchor DID")
        return
      }

      setState((prev) => ({
        ...prev,
        cheqdAnchored: true,
        cheqdTxHash: data.txHash ?? null,
      }))
      toast.success("DID anchored on Cheqd TestNet!")
    } catch {
      toast.error("Failed to anchor DID")
    } finally {
      setAnchoring(false)
    }
  }

  useEffect(() => {
    fetchDID()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!state.did ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              No DID Found
            </CardTitle>
            <CardDescription>
              Generate an Ed25519 keypair and derive your decentralized
              identifier (did:key). Your private key is encrypted with AES-GCM
              before being stored — it never leaves the server in plaintext.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateDID} disabled={generating} className="w-full" size="lg">
              {generating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 size-4" />
              )}
              Generate DID
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Your DID</CardTitle>
                  <CardDescription>
                    Generated at{" "}
                    {state.createdAt
                      ? new Date(state.createdAt).toLocaleString()
                      : "—"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {state.cheqdAnchored ? (
                    <Badge className="bg-green-600 text-white">
                      ✓ Cheqd Anchored
                    </Badge>
                  ) : (
                    <Badge variant="outline">did:key (local)</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                  Decentralized Identifier
                </p>
                <pre className="border-2 border-black bg-white dark:bg-black p-4 font-mono text-sm break-all whitespace-pre-wrap">
                  {state.did}
                </pre>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                  Public Key (Base58)
                </p>
                <pre className="border-2 border-black bg-white dark:bg-black p-4 font-mono text-sm break-all">
                  {state.publicKeyBase58}
                </pre>
              </div>

              {state.cheqdTxHash && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                    Cheqd Transaction Hash
                  </p>
                  <div className="flex items-center gap-2">
                    <pre className="text-muted-foreground underline-offset-4 hover:underline font-mono text-sm break-all flex-1">
                      {state.cheqdTxHash}
                    </pre>
                    <a
                      href={`https://explorer.cheqd.io/transactions/${state.cheqdTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="icon-sm">
                        <ExternalLink className="size-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {isIssuer && !state.cheqdAnchored && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      As the <strong>Issuer</strong>, you can anchor your DID
                      Document on Cheqd TestNet so it can be resolved publicly
                      by Verifiers.
                    </p>
                    <Button
                      onClick={anchorOnCheqd}
                      disabled={anchoring}
                      variant="secondary"
                      className="bg-[#FFDD00] border-2 border-black"
                    >
                      {anchoring ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Anchor className="mr-2 size-4" />
                      )}
                      Anchor DID on Cheqd TestNet
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {state.didDocument && (
            <Card>
              <CardHeader>
                <CardTitle>Resolved DID Document</CardTitle>
                <CardDescription>
                  This is the public DID Document derived from your did:key.
                  It contains your public key and verification methods — no
                  private data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(state.didDocument, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
