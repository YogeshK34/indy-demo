"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CheckCircle, XCircle, Loader2, ShieldCheck, ShieldX } from "lucide-react"
import type { VerificationResult } from "@/types"

interface VerifyResponse {
  valid: boolean
  result: VerificationResult
  error?: string
}

interface CheckItem {
  label: string
  passed: boolean
  description: string
}

export function VerifierDashboardClient() {
  const [jwtVp, setJwtVp] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerifyResponse | null>(null)

  async function handleVerify() {
    if (!jwtVp.trim()) {
      toast.error("Please paste a JWT VP first")
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwtVp }),
      })
      const data = await res.json() as VerifyResponse

      if (!res.ok) {
        toast.error(data.error ?? "Verification failed")
        return
      }

      setResult(data)

      if (data.valid) {
        toast.success("Credential is VALID!")
      } else {
        toast.error("Verification FAILED")
      }
    } catch {
      toast.error("Network error — could not verify")
    } finally {
      setVerifying(false)
    }
  }

  const checks: CheckItem[] = result
    ? [
        {
          label: "VC Signature",
          passed: result.result.vcSignatureValid,
          description:
            "The Verifiable Credential JWT was signed by the stated Issuer DID",
        },
        {
          label: "VP Signature",
          passed: result.result.vpSignatureValid,
          description:
            "The Verifiable Presentation JWT was signed by the stated Holder DID",
        },
        {
          label: "Holder DID Match",
          passed: result.result.holderDidMatch,
          description:
            "The Holder who signed the VP is the same as the credential subject in the VC",
        },
        {
          label: "Not Expired",
          passed: result.result.notExpired,
          description:
            "The credential has not passed its expiry date (or has no expiry set)",
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paste JWT Verifiable Presentation</CardTitle>
          <CardDescription>
            The Holder will share a JWT VP string with you. Paste it below and
            click Verify. The Issuer is never contacted — verification is
            cryptographic and fully offline for did:key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
            value={jwtVp}
            onChange={(e) => setJwtVp(e.target.value)}
            rows={8}
            className="font-mono text-xs resize-none"
          />
          <Button
            onClick={handleVerify}
            disabled={verifying || !jwtVp.trim()}
            className="w-full"
            size="lg"
          >
            {verifying ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 size-4" />
            )}
            Verify Presentation
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Alert
            variant={result.valid ? "success" : "destructive"}
          >
            {result.valid ? (
              <CheckCircle className="size-4" />
            ) : (
              <XCircle className="size-4" />
            )}
            <div className="font-[900] text-lg uppercase tracking-tight mb-2">
              {result.valid ? "✓ CREDENTIAL VALID" : "✗ VERIFICATION FAILED"}
            </div>
            <AlertDescription className="font-medium text-sm">
              {result.valid ? (
                <>
                  Issued by{" "}
                  <span className="font-mono text-xs">
                    {result.result.issuerDid.slice(0, 30)}…
                  </span>
                  , Held by{" "}
                  <span className="font-mono text-xs">
                    {result.result.holderDid.slice(0, 30)}…
                  </span>
                </>
              ) : (
                <>
                  ✗ Verification{" "}
                  <span className="text-destructive">FAILED</span>
                  {result.result.error && (
                    <> — {result.result.error}</>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Breakdown</CardTitle>
              <CardDescription>
                Each step of the cryptographic verification process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between py-3 border-b border-black last:border-0"
                >
                  
                  <div className="space-y-0.5">
                    <span className="text-sm font-mono font-bold uppercase tracking-wide">{check.label}</span>
                  <Badge
                    variant={check.passed ? "success" : "destructive"}
                    className="text-xs rounded-none"
                  >
                    {check.passed ? "✓ PASS" : "✗ FAIL"}
                  </Badge>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">
                    Credential Type
                  </span>
                  <span className="font-mono text-xs">
                    {result.result.credentialType || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">
                    Issuer DID
                  </span>
                  <span className="font-mono text-xs break-all">
                    {result.result.issuerDid || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">
                    Holder DID
                  </span>
                  <span className="font-mono text-xs break-all">
                    {result.result.holderDid || "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
