# Prompt for Claude Sonnet 4.6 — SSI Demo App (Next.js)

## Context

I already have a Next.js project initialized with shadcn/ui components ready. I need you to build a full-stack Self-Sovereign Identity (SSI) demonstration application inside this project. This app is for a technical presentation comparing traditional OAuth identity with decentralized identity (DIDs + VCs).

Do not scaffold a new project. Work within the existing Next.js structure. Use the App Router.

---

## What this app demonstrates

**Part 1 — The OAuth Problem**
When a user logs in with Google OAuth (via Supabase), show exactly what data gets stored in the database and what permissions/scopes were requested. This is the "legacy identity" comparison baseline.

**Part 2 — SSI Flow**
A three-party decentralized identity flow:
- **Issuer** (Google Account A) — creates a DID, issues a Verifiable Credential (VC) to a Holder's DID
- **Holder** (Google Account B) — has a DID, receives the VC, stores it, can present it
- **Verifier** (Google Account C) — verifies a Verifiable Presentation (VP) presented by the Holder, confirms authenticity without contacting the Issuer

---

## Stack

- **Framework**: Next.js (App Router, already initialized)
- **Auth + DB**: Supabase (Google OAuth already needs to be configured — list the exact steps)
- **UI**: shadcn/ui strictly — all components must use shadcn primitives (Card, Button, Badge, Table, Tabs, Dialog, etc.). No raw HTML divs for layout where a shadcn component exists.
- **DID Method**: `did:key` — generate a DID from an Ed25519 keypair entirely client-side or server-side in Next.js. No external DID registries needed for DID creation itself.
- **VC/VP Format**: W3C standard JWT-based Verifiable Credentials and Verifiable Presentations. Use the `@digitalcredentials/vc` or `did-jwt-vc` library — pick whichever integrates cleaner with `did:key` and JWT.
- **Ledger**: Cheqd TestNet — anchor the Issuer's DID Document on Cheqd TestNet so it can be resolved publicly. Use Cheqd's REST API (no heavy SDK). Holder and Verifier DIDs do not need to be anchored — `did:key` resolves locally.

---

## Database Schema (Supabase / Postgres)

Create migrations for the following tables:

### `oauth_data_log`
Stores exactly what Supabase captures on Google OAuth login — for the presentation comparison.
```
id, user_id (fk → auth.users), email, full_name, avatar_url, 
provider, provider_id, scopes_granted (text[]), 
raw_user_meta (jsonb), created_at
```

### `dids`
```
id, user_id (fk → auth.users), did (text, unique), 
public_key_base58 (text), private_key_encrypted (text), 
method (text default 'key'), cheqd_anchored (boolean default false),
cheqd_tx_hash (text nullable), created_at
```

### `credentials`
```
id, issuer_did (text), holder_did (text), 
credential_type (text), credential_subject (jsonb), 
jwt_vc (text), issued_at, expires_at (nullable),
status (text default 'active')
```

### `presentations`
```
id, holder_did (text), verifier_did (text nullable),
jwt_vp (text), verified (boolean default false),
verified_at (timestamp nullable), verification_result (jsonb nullable),
created_at
```

---

## Features to Build

### 1. OAuth Data Inspector (all users see this on first login)

After Google OAuth login via Supabase, intercept the session and log all captured data into `oauth_data_log`. Display a UI page that shows:
- A shadcn `Table` with two columns: **Field** and **Value** — showing every piece of data stored (email, name, avatar, provider_id, scopes, raw metadata)
- A shadcn `Badge` for each scope granted, colored red if it's a write/sensitive scope, green if read-only
- A callout card at the bottom: "This is what every app using Google OAuth stores about you. You did not explicitly approve each field."

This page exists purely for the presentation comparison. Route: `/oauth-inspector`

---

### 2. DID Management (all roles)

Every logged-in user can generate a DID. Route: `/did`

- Generate an Ed25519 keypair in the browser or in a Next.js API route
- Derive `did:key` from the public key
- **Encrypt the private key** with the user's Supabase JWT (use AES-GCM, derive encryption key from the JWT secret or a password the user sets) before storing in `dids` table — never store raw private key
- Display the generated DID in a shadcn `Card`
- Show the resolved DID Document (public key, verification methods) in a `CodeBlock` or `pre` styled element
- If the logged-in user is the **Issuer** (detect by email or a role flag in DB), show an additional button: "Anchor DID on Cheqd TestNet"
  - Call Cheqd TestNet REST API to publish the DID Document
  - Store the transaction hash in `dids.cheqd_tx_hash`
  - Show a link to the Cheqd explorer: `https://explorer.cheqd.io/` with the tx hash

---

### 3. Issuer Dashboard

Route: `/issuer`

Only accessible to the account flagged as Issuer (check `profiles.role = 'issuer'` or match by email — make this configurable via an env var `ISSUER_EMAIL`).

Features:
- Input form (shadcn `Form` with `react-hook-form` + `zod`) to fill credential subject fields:
  - Credential Type (e.g. "UniversityDegreeCredential")
  - Holder DID (text input — the Holder pastes their `did:key` here)
  - Subject fields: Full Name, Degree, Institution, Graduation Year, CGPA
- On submit:
  - Build a W3C VC JSON structure
  - Sign it as a JWT using the Issuer's private key (decrypt from DB using the Issuer's session)
  - Store the `jwt_vc` in `credentials` table
  - Show the raw JWT and the decoded payload side by side in two shadcn `Card` components
  - Show a success toast (shadcn `Sonner` or `Toast`)

---

### 4. Holder Dashboard

Route: `/holder`

Only accessible to the account flagged as Holder (`HOLDER_EMAIL` env var).

Features:
- List all VCs issued to this Holder's DID from the `credentials` table, displayed as shadcn `Card` components
- Each card shows: Credential Type, Issuer DID, Issue Date, Status badge
- A "View Full Credential" button opens a shadcn `Dialog` showing:
  - Decoded JWT payload (pretty-printed JSON)
  - Raw JWT string
- A "Create Presentation" button:
  - Wraps the selected VC into a JWT VP signed by the Holder's private key
  - Stores in `presentations` table
  - Copies the JWT VP to clipboard and shows a toast: "Presentation ready — share this with the Verifier"
- Ownership proof section: show a "Prove Ownership" button that signs a challenge string with the Holder's private key and displays the signature — to demonstrate only the Holder can do this

---

### 5. Verifier Dashboard

Route: `/verifier`

Only accessible to the account flagged as Verifier (`VERIFIER_EMAIL` env var).

Features:
- A text area (shadcn `Textarea`) to paste a JWT VP received from a Holder
- A "Verify" button that:
  - Decodes the JWT VP
  - Extracts the embedded JWT VC
  - Resolves the Issuer's DID (for `did:key`, resolve locally; if anchored on Cheqd, fetch from Cheqd resolver)
  - Verifies the VC signature against the Issuer's public key
  - Verifies the VP signature against the Holder's public key
  - Checks the Holder DID in the VP matches the `credentialSubject` DID in the VC
  - Stores result in `presentations` table
- Display result as a shadcn `Alert`:
  - Green variant: "✓ Credential is VALID — Issued by [Issuer DID], Held by [Holder DID]"
  - Red variant: "✗ Verification FAILED — [reason]"
- Show a detailed breakdown card: each verification step as a checklist (VC signature ✓, VP signature ✓, DID match ✓, not expired ✓)

---

### 6. Presentation Comparison Page

Route: `/compare`

Side-by-side shadcn layout (two columns):

**Left — OAuth Identity**
- What was stored (pull from `oauth_data_log`)
- Permissions granted
- Who controls this data (answer: Google + your app)

**Right — SSI Identity**
- The DID (self-generated, self-owned)
- What the app stored (just the DID and public key)
- Who controls this (answer: only the keyholder)

This is the visual punchline of the presentation.

---

## External Setup Required (list clearly in a `SETUP.md` file)

Generate a `SETUP.md` file at the project root that lists every external step needed:

1. Supabase project creation + Google OAuth setup (exact steps: which URLs to add as redirect URIs, which scopes to enable in Google Cloud Console)
2. Supabase environment variables needed in `.env.local`
3. Cheqd TestNet setup — how to get a testnet wallet, get free CHEQ tokens from the faucet, and the REST API base URL to use
4. Any npm packages to install (list all with exact package names)
5. How to run the Supabase migration
6. The 3 Google accounts needed and how to set the role env vars

---

## Code Quality Requirements

- All API routes in `app/api/` as Next.js Route Handlers
- Private key operations (sign, decrypt) must happen server-side in API routes — never expose private keys to the client
- Use `@supabase/ssr` for Supabase client in App Router (not the legacy `@supabase/auth-helpers-nextjs`)
- All forms use `react-hook-form` + `zod` for validation
- All sensitive DB operations go through Supabase RLS policies — define those in the migration
- TypeScript strictly throughout — no `any` types
- Environment variables: prefix client-safe ones with `NEXT_PUBLIC_`, keep all secrets server-side only

---

## Deliverables

1. All source files (components, API routes, lib utilities, types)
2. Supabase migration SQL file
3. `SETUP.md` with every external step
4. `.env.local.example` with all required variables and comments explaining each

Start by laying out the full file structure, then implement file by file. Do not skip files or leave placeholder comments like `// TODO implement this` — write complete, working code for every file.
