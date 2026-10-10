/**
 * DID/VC cryptographic utilities — server-side only
 * Uses @noble/ed25519 v3 for Ed25519 key operations
 */

import * as ed from "@noble/ed25519"
import { sha512 } from "@noble/hashes/sha2.js"

// @noble/ed25519 v3: wire sha512 into hashes
ed.hashes.sha512 = sha512

// Base58 encode/decode (Bitcoin alphabet)
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return ""
  
  // Count leading zeros
  let leadingZeros = 0
  for (const b of bytes) {
    if (b === 0) leadingZeros++
    else break
  }

  // Convert to bigint
  let num = BigInt(0)
  for (const b of bytes) {
    num = num * BigInt(256) + BigInt(b)
  }

  let result = ""
  while (num > BigInt(0)) {
    result = BASE58_ALPHABET[Number(num % BigInt(58))] + result
    num = num / BigInt(58)
  }

  return BASE58_ALPHABET[0].repeat(leadingZeros) + result
}

function base58Decode(str: string): Uint8Array {
  if (!str) return new Uint8Array(0)

  let leadingZeros = 0
  for (const char of str) {
    if (char === BASE58_ALPHABET[0]) leadingZeros++
    else break
  }

  let num = BigInt(0)
  const base = BigInt(58)
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error("Invalid base58 character: " + char)
    num = num * base + BigInt(idx)
  }

  if (num === BigInt(0) && leadingZeros === 0) return new Uint8Array(0)

  const hex = num.toString(16).padStart(2, "0")
  const hexPadded = hex.length % 2 !== 0 ? "0" + hex : hex
  const bytes = new Uint8Array(hexPadded.length / 2)
  for (let i = 0; i < hexPadded.length; i += 2) {
    bytes[i / 2] = parseInt(hexPadded.slice(i, i + 2), 16)
  }

  const result = new Uint8Array(leadingZeros + bytes.length)
  result.set(bytes, leadingZeros)
  return result
}

// Multicodec prefix for Ed25519 public keys = 0xed01
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01])

/**
 * Generate an Ed25519 keypair and derive did:key
 */
export async function generateDidKey(): Promise<{
  did: string
  publicKeyBase58: string
  privateKeyHex: string
}> {
  // @noble/ed25519 v3: randomSecretKey generates the private key
  const privateKeyBytes = ed.utils.randomSecretKey()
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes)

  // did:key uses multibase encoding (base58btc with 'z' prefix) of
  // multicodec-prefixed public key bytes
  const multicodecKey = new Uint8Array([
    ...ED25519_MULTICODEC_PREFIX,
    ...publicKeyBytes,
  ])
  const multibaseEncoded = "z" + base58Encode(multicodecKey)
  const did = `did:key:${multibaseEncoded}`

  const publicKeyBase58 = base58Encode(publicKeyBytes)
  const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex")

  return { did, publicKeyBase58, privateKeyHex }
}

/**
 * Resolve a did:key to its DID Document (local resolution, no registry)
 */
export function resolveDidKey(did: string): {
  "@context": string[]
  id: string
  verificationMethod: {
    id: string
    type: string
    controller: string
    publicKeyBase58: string
  }[]
  authentication: string[]
  assertionMethod: string[]
} {
  if (!did.startsWith("did:key:z")) {
    throw new Error("Not a valid did:key: " + did)
  }
  const multibaseKey = did.replace("did:key:", "")
  const keyId = `${did}#${multibaseKey}`

  // Decode multibase (base58btc with 'z' prefix) → strip multicodec prefix → raw public key
  const decoded = base58Decode(multibaseKey.slice(1)) // remove 'z'
  const rawPublicKey = decoded.slice(2) // remove 2-byte multicodec prefix
  const publicKeyBase58 = base58Encode(rawPublicKey)

  return {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyBase58,
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
  }
}

/**
 * Encrypt private key using AES-GCM with a key derived from the encryption secret
 */
export async function encryptPrivateKey(
  privateKeyHex: string,
  userId: string
): Promise<string> {
  const secret = process.env.PRIVATE_KEY_ENCRYPTION_SECRET!
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret + userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("ssi-demo-salt-" + userId),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(privateKeyHex)
  )

  // Return iv + ciphertext as hex
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.byteLength)
  return Buffer.from(combined).toString("hex")
}

/**
 * Decrypt private key using AES-GCM
 */
export async function decryptPrivateKey(
  encryptedHex: string,
  userId: string
): Promise<string> {
  const secret = process.env.PRIVATE_KEY_ENCRYPTION_SECRET!
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret + userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("ssi-demo-salt-" + userId),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  )

  const combined = new Uint8Array(Buffer.from(encryptedHex, "hex"))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  )
  return new TextDecoder().decode(decrypted)
}

/**
 * Sign data with Ed25519 private key, returns base64url signature
 */
export async function signWithPrivateKey(
  data: string,
  privateKeyHex: string
): Promise<string> {
  const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, "hex"))
  const messageBytes = new TextEncoder().encode(data)
  const signature = await ed.signAsync(messageBytes, privateKeyBytes)
  return Buffer.from(signature).toString("base64url")
}

/**
 * Create a JWT-VC (Verifiable Credential as JWT)
 * Header.Payload.Signature — all base64url encoded
 */
export async function createJwtVC(params: {
  issuerDid: string
  holderDid: string
  credentialType: string
  credentialSubject: Record<string, unknown>
  privateKeyHex: string
  expiresInSeconds?: number
}): Promise<string> {
  const {
    issuerDid,
    holderDid,
    credentialType,
    credentialSubject,
    privateKeyHex,
    expiresInSeconds,
  } = params

  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: "EdDSA",
    typ: "JWT",
  }
  const payload: Record<string, unknown> = {
    iss: issuerDid,
    sub: holderDid,
    nbf: now,
    vc: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential", credentialType],
      credentialSubject: {
        id: holderDid,
        ...credentialSubject,
      },
    },
    jti: `urn:uuid:${crypto.randomUUID()}`,
  }
  if (expiresInSeconds) {
    payload.exp = now + expiresInSeconds
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url")
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signingInput = `${headerB64}.${payloadB64}`

  const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, "hex"))
  const signature = await ed.signAsync(
    new TextEncoder().encode(signingInput),
    privateKeyBytes
  )
  const sigB64 = Buffer.from(signature).toString("base64url")

  return `${signingInput}.${sigB64}`
}

/**
 * Create a JWT-VP (Verifiable Presentation as JWT)
 */
export async function createJwtVP(params: {
  holderDid: string
  jwtVc: string
  privateKeyHex: string
}): Promise<string> {
  const { holderDid, jwtVc, privateKeyHex } = params

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "EdDSA", typ: "JWT" }
  const payload = {
    iss: holderDid,
    nbf: now,
    nonce: crypto.randomUUID(),
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation"],
      verifiableCredential: [jwtVc],
    },
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url")
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signingInput = `${headerB64}.${payloadB64}`

  const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, "hex"))
  const signature = await ed.signAsync(
    new TextEncoder().encode(signingInput),
    privateKeyBytes
  )
  const sigB64 = Buffer.from(signature).toString("base64url")

  return `${signingInput}.${sigB64}`
}

/**
 * Verify a JWT-VP and the embedded JWT-VC
 */
export async function verifyJwtVP(jwtVp: string): Promise<{
  vcSignatureValid: boolean
  vpSignatureValid: boolean
  holderDidMatch: boolean
  notExpired: boolean
  issuerDid: string
  holderDid: string
  credentialType: string
  error?: string
}> {
  const result = {
    vcSignatureValid: false,
    vpSignatureValid: false,
    holderDidMatch: false,
    notExpired: false,
    issuerDid: "",
    holderDid: "",
    credentialType: "",
  }

  try {
    const [vpHeaderB64, vpPayloadB64, vpSigB64] = jwtVp.split(".")
    if (!vpHeaderB64 || !vpPayloadB64 || !vpSigB64) {
      throw new Error("Invalid JWT VP format")
    }

    const vpPayload = JSON.parse(
      Buffer.from(vpPayloadB64, "base64url").toString()
    ) as Record<string, unknown>
    const holderDid = vpPayload.iss as string
    result.holderDid = holderDid

    // Verify VP signature
    const holderPublicKeyBytes = getPublicKeyBytesFromDid(holderDid)
    const vpSigningInput = `${vpHeaderB64}.${vpPayloadB64}`
    const vpSigBytes = new Uint8Array(Buffer.from(vpSigB64, "base64url"))
    result.vpSignatureValid = await ed.verifyAsync(
      vpSigBytes,
      new TextEncoder().encode(vpSigningInput),
      holderPublicKeyBytes
    )

    // Extract and decode VC
    const vpObj = vpPayload.vp as Record<string, unknown>
    const verifiableCredential = vpObj?.verifiableCredential as string[] | undefined
    const jwtVc = verifiableCredential?.[0]
    if (!jwtVc) throw new Error("No VC found in VP")

    const [vcHeaderB64, vcPayloadB64, vcSigB64] = jwtVc.split(".")
    if (!vcHeaderB64 || !vcPayloadB64 || !vcSigB64) {
      throw new Error("Invalid JWT VC format")
    }

    const vcPayload = JSON.parse(
      Buffer.from(vcPayloadB64, "base64url").toString()
    ) as Record<string, unknown>

    const issuerDid = vcPayload.iss as string
    result.issuerDid = issuerDid
    
    const vcObj = vcPayload.vc as Record<string, unknown> | undefined
    const vcTypes = vcObj?.type as string[] | undefined
    result.credentialType =
      vcTypes?.find((t: string) => t !== "VerifiableCredential") ?? "Unknown"

    // Verify VC signature
    const issuerPublicKeyBytes = getPublicKeyBytesFromDid(issuerDid)
    const vcSigningInput = `${vcHeaderB64}.${vcPayloadB64}`
    const vcSigBytes = new Uint8Array(Buffer.from(vcSigB64, "base64url"))
    result.vcSignatureValid = await ed.verifyAsync(
      vcSigBytes,
      new TextEncoder().encode(vcSigningInput),
      issuerPublicKeyBytes
    )

    // Check holder DID match
    const vcSubject = (vcPayload.sub as string) ?? 
      ((vcObj?.credentialSubject as Record<string, unknown>)?.id as string)
    result.holderDidMatch = vcSubject === holderDid

    // Check expiry
    const now = Math.floor(Date.now() / 1000)
    const exp = vcPayload.exp as number | undefined
    if (exp) {
      result.notExpired = exp > now
    } else {
      result.notExpired = true
    }

    return result
  } catch (err) {
    return {
      ...result,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Extract raw Ed25519 public key bytes from a did:key
 */
function getPublicKeyBytesFromDid(did: string): Uint8Array {
  if (!did.startsWith("did:key:z")) {
    throw new Error("Only did:key is supported for local resolution: " + did)
  }
  const multibaseKey = did.replace("did:key:", "").slice(1) // remove 'z'
  const decoded = base58Decode(multibaseKey)
  return decoded.slice(2) // remove 2-byte multicodec prefix
}
