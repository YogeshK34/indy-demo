# SETUP.md — SSI Demo App External Configuration

This file lists every external step required to run the SSI demo application.

---

## 1. Supabase Project Setup

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose your organization, give it a name (e.g., `ssi-demo`), set a database password, select a region
4. Wait for the project to initialize (~2 minutes)

### 1.2 Configure Google OAuth

1. **Google Cloud Console:**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **Google OAuth2 API** (or "Identity Platform")
   - Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs:**
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project ref)
   - Copy the **Client ID** and **Client Secret**

2. **Supabase Dashboard:**
   - Go to **Authentication → Providers → Google**
   - Toggle it **ON**
   - Paste your Google **Client ID** and **Client Secret**
   - Under **Redirect URLs**, add:
     ```
     http://localhost:3000/api/auth/callback
     https://your-production-domain.com/api/auth/callback
     ```
   - Click **Save**

3. **Google OAuth Scopes to Enable:**
   - `openid`
   - `email`
   - `profile`
   
   (These are the default Google scopes — no additional configuration needed)

---

## 2. Environment Variables

Create a `.env.local` file in the project root. Copy `.env.local.example` and fill in your values:

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `ISSUER_EMAIL` | The Google email you'll use for the Issuer role |
| `HOLDER_EMAIL` | The Google email you'll use for the Holder role |
| `VERIFIER_EMAIL` | The Google email you'll use for the Verifier role |
| `PRIVATE_KEY_ENCRYPTION_SECRET` | Run: `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

**Optional (for Cheqd TestNet anchoring):**

| Variable | Description |
|---|---|
| `CHEQD_API_BASE_URL` | `https://api.cheqd.network` |
| `CHEQD_RPC_URL` | `https://rpc.cheqd.network` |
| `CHEQD_MNEMONIC` | Your 12-word Cheqd testnet wallet mnemonic |
| `CHEQD_CHAIN_ID` | `cheqd-testnet-6` |

---

## 3. Run the Supabase Migration

### Option A — Supabase SQL Editor (recommended for first-time setup)

1. Open your Supabase project dashboard
2. Go to **SQL Editor → New query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**

### Option B — Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

---

## 4. Cheqd TestNet Setup (for DID Anchoring)

Cheqd TestNet is used to anchor the Issuer's DID Document publicly.

### 4.1 Get a Cheqd TestNet Wallet

Option A — **Leap Wallet** (browser extension, easiest):
1. Install [Leap Wallet](https://leapwallet.io/)
2. Create a new wallet — save your 12-word mnemonic
3. Switch to the **Cheqd Testnet** network

Option B — **Cheqd CLI**:
```bash
# Install cheqd-noded
wget https://github.com/cheqd/cheqd-node/releases/latest/download/cheqd-noded-linux-amd64

# Generate a new key
./cheqd-noded keys add issuer --keyring-backend test
# This outputs your mnemonic — save it as CHEQD_MNEMONIC
```

### 4.2 Get Free CHEQ TestNet Tokens

Go to the Cheqd Testnet Faucet:
- **URL:** [https://testnet-faucet.cheqd.io/](https://testnet-faucet.cheqd.io/)
- Enter your Cheqd testnet address
- Request tokens (you need CHEQ to pay gas fees for DID anchoring)

### 4.3 Cheqd REST API

The app uses the Cheqd REST API to anchor DID Documents:
- **Base URL:** `https://api.cheqd.network`
- **Explorer:** [https://explorer.cheqd.io/](https://explorer.cheqd.io/)

---

## 5. npm Packages to Install

All packages are listed in `package.json`. Install with:

```bash
pnpm install
```

Key packages added beyond the base Next.js setup:

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Supabase server-side rendering helpers |
| `@noble/ed25519` | Ed25519 key generation and signing |
| `@noble/hashes` | SHA-512 (required by @noble/ed25519) |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod integration for react-hook-form |
| `zod` | Schema validation |
| `sonner` | Toast notifications |
| `@radix-ui/react-slot` | Radix UI Slot primitive |
| `@radix-ui/react-label` | Radix UI Label primitive |

---

## 6. The 3 Google Accounts

You need **3 separate Google accounts** for the full demo:

| Role | Email (example) | Access |
|---|---|---|
| **Issuer** | `issuer.ssi.demo@gmail.com` | `/issuer` — issues VCs, can anchor DID on Cheqd |
| **Holder** | `holder.ssi.demo@gmail.com` | `/holder` — receives VCs, creates VPs |
| **Verifier** | `verifier.ssi.demo@gmail.com` | `/verifier` — verifies VPs |

Set these in `.env.local`:
```env
ISSUER_EMAIL=issuer.ssi.demo@gmail.com
HOLDER_EMAIL=holder.ssi.demo@gmail.com
VERIFIER_EMAIL=verifier.ssi.demo@gmail.com
```

Any other Google account that logs in will see the OAuth Inspector and Compare pages but not the role-specific dashboards.

---

## 7. Running the App

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 8. Demo Flow (for presentation)

1. **Part 1 — OAuth Problem:**
   - Log in with any Google account
   - Navigate to `/oauth-inspector`
   - Show the table of data captured and scope badges

2. **Part 2 — SSI Flow:**
   - **Issuer account:** Go to `/did` → Generate DID → (optionally) Anchor on Cheqd
   - **Holder account:** Go to `/did` → Generate DID → Copy DID
   - **Issuer:** Go to `/issuer` → Paste Holder DID → Issue credential
   - **Holder:** Go to `/holder` → View credential → Create Presentation → Copy JWT VP
   - **Verifier:** Go to `/verifier` → Paste JWT VP → Verify → See checklist

3. **Part 3 — Comparison:**
   - Navigate to `/compare` (works with any logged-in account)
   - Show the side-by-side table as the visual punchline
