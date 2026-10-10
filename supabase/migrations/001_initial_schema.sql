-- ============================================================
-- SSI Demo App — Supabase Migration
-- Run: pnpm supabase db push  OR  paste in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Table: oauth_data_log
-- Stores exactly what Supabase captures on Google OAuth login
-- ============================================================
CREATE TABLE IF NOT EXISTS public.oauth_data_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text NOT NULL,
  full_name        text,
  avatar_url       text,
  provider         text NOT NULL DEFAULT 'google',
  provider_id      text NOT NULL,
  scopes_granted   text[] NOT NULL DEFAULT '{}',
  raw_user_meta    jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Upsert constraint — one record per user
CREATE UNIQUE INDEX IF NOT EXISTS oauth_data_log_user_id_idx
  ON public.oauth_data_log (user_id);

-- RLS Policies for oauth_data_log
ALTER TABLE public.oauth_data_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own oauth data"
  ON public.oauth_data_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth data"
  ON public.oauth_data_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth data"
  ON public.oauth_data_log
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Table: dids
-- Stores DID records — private key encrypted, never raw
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dids (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  did                   text NOT NULL UNIQUE,
  public_key_base58     text NOT NULL,
  private_key_encrypted text NOT NULL,
  method                text NOT NULL DEFAULT 'key',
  cheqd_anchored        boolean NOT NULL DEFAULT false,
  cheqd_tx_hash         text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- One DID per user
CREATE UNIQUE INDEX IF NOT EXISTS dids_user_id_idx
  ON public.dids (user_id);

-- RLS Policies for dids
ALTER TABLE public.dids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DID"
  ON public.dids
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own DID"
  ON public.dids
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own DID"
  ON public.dids
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can read all DIDs (for verification lookups)
CREATE POLICY "Service role can read all DIDs"
  ON public.dids
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================================
-- Table: credentials
-- Stores issued JWT-VCs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credentials (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  issuer_did          text NOT NULL,
  holder_did          text NOT NULL,
  credential_type     text NOT NULL,
  credential_subject  jsonb NOT NULL DEFAULT '{}',
  jwt_vc              text NOT NULL,
  issued_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  status              text NOT NULL DEFAULT 'active',
  CONSTRAINT credentials_status_check CHECK (status IN ('active', 'revoked', 'expired'))
);

-- Index for holder lookups
CREATE INDEX IF NOT EXISTS credentials_holder_did_idx
  ON public.credentials (holder_did);

CREATE INDEX IF NOT EXISTS credentials_issuer_did_idx
  ON public.credentials (issuer_did);

-- RLS Policies for credentials
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Users can read credentials where they are the holder
-- (matches their DID in the dids table)
CREATE POLICY "Holders can read their credentials"
  ON public.credentials
  FOR SELECT
  USING (
    holder_did IN (
      SELECT did FROM public.dids WHERE user_id = auth.uid()
    )
  );

-- Issuers can read credentials they issued
CREATE POLICY "Issuers can read credentials they issued"
  ON public.credentials
  FOR SELECT
  USING (
    issuer_did IN (
      SELECT did FROM public.dids WHERE user_id = auth.uid()
    )
  );

-- Issuers can insert credentials
CREATE POLICY "Issuers can insert credentials"
  ON public.credentials
  FOR INSERT
  WITH CHECK (
    issuer_did IN (
      SELECT did FROM public.dids WHERE user_id = auth.uid()
    )
  );

-- Service role can access all credentials (for verification)
CREATE POLICY "Service role full access to credentials"
  ON public.credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: presentations
-- Stores JWT-VPs created by holders and verification results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.presentations (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  holder_did            text NOT NULL,
  verifier_did          text,
  jwt_vp                text NOT NULL,
  verified              boolean NOT NULL DEFAULT false,
  verified_at           timestamptz,
  verification_result   jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presentations_holder_did_idx
  ON public.presentations (holder_did);

-- RLS Policies for presentations
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holders can read their presentations"
  ON public.presentations
  FOR SELECT
  USING (
    holder_did IN (
      SELECT did FROM public.dids WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert presentations (for verification)"
  ON public.presentations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Verifiers can update verification result"
  ON public.presentations
  FOR UPDATE
  USING (
    verifier_did IN (
      SELECT did FROM public.dids WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to presentations"
  ON public.presentations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
