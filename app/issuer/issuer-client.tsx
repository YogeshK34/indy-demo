"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FileText, Loader2 } from "lucide-react"

const IssueFormSchema = z.object({
  credentialType: z.string().min(1, "Required"),
  holderDid: z.string().startsWith("did:", "Must start with 'did:'"),
  fullName: z.string().min(1, "Required"),
  degree: z.string().min(1, "Required"),
  institution: z.string().min(1, "Required"),
  graduationYear: z.coerce.number().int().min(1900).max(2100),
  cgpa: z.coerce.number().min(0).max(10),
})

type IssueFormValues = z.infer<typeof IssueFormSchema>

interface IssuedVC {
  jwtVc: string
  decodedPayload: Record<string, unknown>
  issuerDid: string
  holderDid: string
  credentialType: string
}

export function IssuerDashboardClient() {
  const [issued, setIssued] = useState<IssuedVC | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(IssueFormSchema) as any,
    defaultValues: {
      credentialType: "UniversityDegreeCredential",
      holderDid: "",
      fullName: "",
      degree: "",
      institution: "",
      graduationYear: new Date().getFullYear(),
      cgpa: 0,
    },
  })

  async function onSubmit(values: IssueFormValues) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/credentials/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialType: values.credentialType,
          holderDid: values.holderDid,
          subject: {
            fullName: values.fullName,
            degree: values.degree,
            institution: values.institution,
            graduationYear: values.graduationYear,
            cgpa: values.cgpa,
          },
        }),
      })

      const data = await res.json() as IssuedVC & { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to issue credential")
        return
      }

      setIssued(data)
      toast.success("Verifiable Credential issued successfully!")
      form.reset()
    } catch {
      toast.error("Network error — could not issue credential")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-[6px_6px_0px_#0A0A0A] dark:shadow-[6px_6px_0px_#F5F5F0]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Issue a Verifiable Credential
          </CardTitle>
          <CardDescription>
            Fill in the credential details. The VC will be signed with your
            Ed25519 private key and stored as a JWT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="credentialType"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Credential Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="UniversityDegreeCredential"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="holderDid"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Holder DID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="did:key:z6Mk..."
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="col-span-2" />

                <FormField
                  control={form.control as any}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bachelor of Technology"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MIT"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="graduationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduation Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="cgpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CGPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="8.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Issue Credential
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {issued && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-white">✓ Issued</Badge>
            <span className="text-sm text-muted-foreground">
              Credential successfully created and stored
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-tight">DECODED PAYLOAD</CardTitle>
                <CardDescription>
                  Human-readable JWT payload — the actual credential data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(issued.decodedPayload, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-tight">RAW JWT</CardTitle>
                <CardDescription>
                  The signed JWT — share this with the Holder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {issued.jwtVc}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
