/**
 * Role detection utilities
 */
import { type UserRole } from "@/types"

export function getUserRole(email: string): UserRole {
  if (email === process.env.ISSUER_EMAIL) return "issuer"
  if (email === process.env.HOLDER_EMAIL) return "holder"
  if (email === process.env.VERIFIER_EMAIL) return "verifier"
  return "user"
}

export function isIssuer(email: string): boolean {
  return email === process.env.ISSUER_EMAIL
}

export function isHolder(email: string): boolean {
  return email === process.env.HOLDER_EMAIL
}

export function isVerifier(email: string): boolean {
  return email === process.env.VERIFIER_EMAIL
}
