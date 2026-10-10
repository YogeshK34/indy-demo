import { connection } from "next/server"
export const instant = false
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import type { OAuthDataLog } from "@/types"

const SENSITIVE_SCOPES = ["profile", "email"]
const WRITE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/gmail",
  "https://www.googleapis.com/auth/calendar",
  "https://mail.google.com/",
]

function scopeColor(scope: string): "destructive" | "secondary" {
  if (WRITE_SCOPES.some((s) => scope.includes(s))) return "destructive"
  return "secondary"
}

export default async function OAuthInspectorPage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: oauthLog } = await supabase
    .from("oauth_data_log")
    .select("*")
    .eq("user_id", user.id)
    .single<OAuthDataLog>()

  const rows: { field: string; value: string }[] = oauthLog
    ? [
        { field: "Email", value: oauthLog.email },
        { field: "Full Name", value: oauthLog.full_name ?? "—" },
        { field: "Avatar URL", value: oauthLog.avatar_url ?? "—" },
        { field: "Provider", value: oauthLog.provider },
        { field: "Provider ID (sub)", value: oauthLog.provider_id },
        {
          field: "Login Timestamp",
          value: new Date(oauthLog.created_at).toLocaleString(),
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-[900] tracking-[-0.04em] uppercase">WHAT GOOGLE KNOWS ABOUT YOU</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          data captured on login · read-only
        </p>
        <hr className="border-t-2 border-black mt-4 mb-8" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Captured on Login</CardTitle>
          <CardDescription>
            Every field below was automatically collected and stored by Supabase
            during your Google OAuth authentication — without any explicit field-by-field consent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {oauthLog ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.field}>
                    <TableCell className="font-medium font-mono text-xs uppercase">{row.field}</TableCell>
                    <TableCell className="font-mono text-sm break-all">
                      {row.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              No OAuth log found. Try logging out and back in.
            </p>
          )}
        </CardContent>
      </Card>

      {oauthLog && (
        <Card>
          <CardHeader>
            <CardTitle>Scopes Granted</CardTitle>
            <CardDescription>
              These are the permission scopes your session authorized.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {oauthLog.scopes_granted.map((scope) => (
                <Badge key={scope} variant={scopeColor(scope) === "destructive" ? "destructive" : "success"}>
                  {scope}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {oauthLog && (
        <Card>
          <CardHeader>
            <CardTitle>Raw User Metadata (JSON)</CardTitle>
            <CardDescription>
              This is the full raw_user_meta JSON blob stored in Supabase — everything
              Google returned in its ID token and userinfo response.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(oauthLog.raw_user_meta, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="border-l-[6px] border-l-[#FF2D2D] rounded-none">
        <CardHeader>
          <CardTitle className="font-bold">THE PROBLEM</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <strong>This is what every app using Google OAuth stores about you.</strong>
          {" "}Your name, email, profile picture, and a unique Google ID are all
          captured and stored — and you did not explicitly approve each field.
          The app operator can share, sell, or lose this data. You have no
          cryptographic control over it.
        </CardContent>
      </Card>
    </div>
  )
}
