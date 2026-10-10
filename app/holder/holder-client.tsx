"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { UserCheck, Loader2, Eye, Share2, ShieldCheck, ClipboardCopy } from "lucide-react"
import type { CredentialRecord } from "@/types"

interface HolderResponse {
  credentials: CredentialRecord[]
  holderDid: string | null
}

interface OwnershipProof {
  challenge: string
  signature: string
  did: string
}

export function HolderDashboardClient() {
  const [credentials, setCredentials] = useState<CredentialRecord[]>([])
  const [holderDid, setHolderDid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [ownershipProof, setOwnershipProof] = useState<OwnershipProof | null>(null)
  const [provingOwnership, setProvingOwnership] = useState(false)

  const fetchCredentials = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/credentials/holder")
      const data = await res.json() as HolderResponse
      setCredentials(data.credentials)
      setHolderDid(data.holderDid)
    } catch {
      toast.error("Failed to load credentials")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  async function createPresentation(credentialId: string) {
    setCreating(credentialId)
    try {
      const res = await fetch("/api/credentials/holder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      })
      const data = await res.json() as { jwtVp?: string; error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create presentation")
        return
      }

      await navigator.clipboard.writeText(data.jwtVp ?? "")
      toast.success("Presentation ready — copied to clipboard! Share this with the Verifier.")
    } catch {
      toast.error("Failed to create presentation")
    } finally {
      setCreating(null)
    }
  }

  async function proveOwnership() {
    setProvingOwnership(true)
    try {
      const res = await fetch("/api/credentials/holder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prove-ownership" }),
      })
      const data = await res.json() as OwnershipProof & { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to prove ownership")
        return
      }

      setOwnershipProof(data)
      toast.success("Ownership proof generated!")
    } catch {
      toast.error("Failed to prove ownership")
    } finally {
      setProvingOwnership(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {holderDid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Holder DID</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="border-2 border-black bg-white dark:bg-black px-4 py-3 text-xs font-mono break-all whitespace-pre-wrap">
              {holderDid}
            </pre>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Your Verifiable Credentials
          {credentials.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {credentials.length}
            </Badge>
          )}
        </h2>

        {credentials.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <UserCheck className="size-10 mx-auto mb-3 opacity-30" />
              <p>No credentials yet. Ask the Issuer to issue one to your DID.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {credentials.map((cred) => {
              const payloadB64 = cred.jwt_vc.split(".")[1]
              const normalizedBase64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/")
              const payload = JSON.parse(
                Buffer.from(normalizedBase64, "base64").toString()
              ) as Record<string, unknown>

              return (
                <Card key={cred.id} className="border-l-[6px] border-l-[#0A0A0A] dark:border-l-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold uppercase">
                          {cred.credential_type}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          {cred.issuer_did.slice(0, 40)}…
                        </CardDescription>
                      </div>
                      <Badge variant={cred.status === "active" ? "default" : "destructive"} className="uppercase">
                        {cred.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Issued:{" "}
                      {new Date(cred.issued_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {cred.expires_at &&
                        ` · Expires: ${new Date(cred.expires_at).toLocaleDateString()}`}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {/* View full credential dialog */}
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1.5 size-3.5" />
                              View Full Credential
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{cred.credential_type}</DialogTitle>
                            <DialogDescription>
                              Decoded payload and raw JWT string
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Decoded JWT Payload
                              </p>
                              <pre className="border-2 border-black bg-[#0A0A0A] text-[#00C853] p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(payload, null, 2)}
                              </pre>
                            </div>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Raw JWT (jwt_vc)
                              </p>
                              <pre className="border-2 border-black bg-[#0A0A0A] text-[#00C853] p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                                {cred.jwt_vc}
                              </pre>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Create presentation */}
                      <Button
                        size="sm"
                        onClick={() => createPresentation(cred.id)}
                        disabled={creating === cred.id}
                        className="bg-[#FFDD00] text-black border-2 border-black hover:bg-[#FFDD00]/90"
                      >
                        {creating === cred.id ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <Share2 className="mr-1.5 size-3.5" />
                        )}
                        Create Presentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Ownership Proof Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">
            <ShieldCheck className="size-4" />
            PROVE OWNERSHIP
          </CardTitle>
          <CardDescription>
            Sign a challenge string with your Ed25519 private key to demonstrate
            that only you control this DID — without revealing the private key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="secondary"
            onClick={proveOwnership}
            disabled={provingOwnership}
          >
            {provingOwnership ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 size-4" />
            )}
            Prove Ownership
          </Button>

          {ownershipProof && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  ONLY YOUR KEY CAN PRODUCE THIS
                </p>
                <pre className="border-2 border-black bg-white dark:bg-black px-4 py-3 text-xs font-mono break-all">
                  {ownershipProof.challenge}
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ed25519 Signature (base64url)
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(ownershipProof.signature)
                      toast.success("Signature copied!")
                    }}
                  >
                    <ClipboardCopy className="size-3" />
                  </Button>
                </div>
                <pre className="border-2 border-black bg-white dark:bg-black px-4 py-3 text-xs font-mono break-all">
                  {ownershipProof.signature}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
