-- =============================================================
-- SaSa — Software as Security Auditor
-- PostgreSQL Schema v1.0
-- Multi-tenant ready (single-tenant launch)
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUM: Scan Status
-- =============================================================
DO $$ BEGIN
  CREATE TYPE scan_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- TABLE: agencies
-- Stores each tenant/agency profile and white-label config
-- =============================================================
CREATE TABLE IF NOT EXISTS agencies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name          VARCHAR(255) NOT NULL,
  brand_hex_color       VARCHAR(7) NOT NULL DEFAULT '#6366F1',   -- e.g. #FF5733
  white_label_logo_url  TEXT,
  subscription_status   VARCHAR(50) NOT NULL DEFAULT 'active',  -- active | suspended | trial
  auth_method           VARCHAR(20) NOT NULL DEFAULT 'jwt',      -- jwt | api_key
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: agency_api_keys
-- Hashed API keys for programmatic access (sk_sasa_live_...)
-- =============================================================
CREATE TABLE IF NOT EXISTS agency_api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  key_hash      TEXT NOT NULL UNIQUE,          -- bcrypt hash of the actual key
  key_prefix    VARCHAR(20) NOT NULL,          -- first 8 chars shown in UI (e.g. sk_sasa_li...)
  label         VARCHAR(100),                  -- friendly name for the key
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: scans
-- Core scan record — tied to an agency, holds all results
-- =============================================================
CREATE TABLE IF NOT EXISTS scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  target_url    TEXT NOT NULL,
  status        scan_status NOT NULL DEFAULT 'PENDING',
  safety_score  INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  raw_results   JSONB,        -- structured vulnerability findings from all workers
  error_message TEXT,         -- populated if status = FAILED
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES for performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_scans_agency_id  ON scans(agency_id);
CREATE INDEX IF NOT EXISTS idx_scans_status     ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_agency  ON agency_api_keys(agency_id);

-- =============================================================
-- FUNCTION + TRIGGER: auto-update updated_at on row change
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- SEED: Default agency for single-tenant launch
-- (Replace values after first setup via the Agency Setup Wizard)
-- =============================================================
INSERT INTO agencies (company_name, brand_hex_color, subscription_status, auth_method)
VALUES ('My Agency', '#6366F1', 'active', 'jwt')
ON CONFLICT DO NOTHING;
