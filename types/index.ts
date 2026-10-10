// ==========================================
// Database Row Types
// ==========================================

export interface OAuthDataLog {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string
  provider_id: string
  scopes_granted: string[]
  raw_user_meta: Record<string, unknown>
  created_at: string
}

export interface DIDRecord {
  id: string
  user_id: string
  did: string
  public_key_base58: string
  private_key_encrypted: string
  method: string
  cheqd_anchored: boolean
  cheqd_tx_hash: string | null
  created_at: string
}

export interface CredentialRecord {
  id: string
  issuer_did: string
  holder_did: string
  credential_type: string
  credential_subject: Record<string, unknown>
  jwt_vc: string
  issued_at: string
  expires_at: string | null
  status: string
}

export interface PresentationRecord {
  id: string
  holder_did: string
  verifier_did: string | null
  jwt_vp: string
  verified: boolean
  verified_at: string | null
  verification_result: VerificationResult | null
  created_at: string
}

// ==========================================
// SSI / VC Types
// ==========================================

export interface VerificationResult {
  vcSignatureValid: boolean
  vpSignatureValid: boolean
  holderDidMatch: boolean
  notExpired: boolean
  issuerDid: string
  holderDid: string
  credentialType: string
  error?: string
}

export interface CredentialSubjectPayload {
  fullName: string
  degree: string
  institution: string
  graduationYear: number
  cgpa: number
}

export interface IssueCredentialRequest {
  credentialType: string
  holderDid: string
  subject: CredentialSubjectPayload
}

export interface DIDDocument {
  "@context": string[]
  id: string
  verificationMethod: VerificationMethod[]
  authentication: string[]
  assertionMethod: string[]
  capabilityDelegation?: string[]
  capabilityInvocation?: string[]
  keyAgreement?: (string | VerificationMethod)[]
}

export interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyBase58?: string
  publicKeyMultibase?: string
}

export interface JWTVCPayload {
  iss: string
  sub: string
  vc: {
    "@context": string[]
    type: string[]
    credentialSubject: Record<string, unknown>
  }
  nbf: number
  exp?: number
  jti?: string
}

export interface JWTVPPayload {
  iss: string
  vp: {
    "@context": string[]
    type: string[]
    verifiableCredential: string[]
  }
  nonce?: string
}

// ==========================================
// User / Auth Types
// ==========================================

export type UserRole = "issuer" | "holder" | "verifier" | "user"

export interface AppUser {
  id: string
  email: string
  role: UserRole
}
