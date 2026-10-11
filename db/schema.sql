-- drop — Neon Postgres schema
-- Run once: psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(6) NOT NULL UNIQUE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transfers_code ON transfers (code);
CREATE INDEX IF NOT EXISTS idx_transfers_expires ON transfers (expires_at);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers (id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_files_transfer ON files (transfer_id);

-- Neon-only file bytes (no R2 / no card needed). file_id is deliberately
-- NOT a FK so bytes can arrive before POST /:id/complete inserts the row.
CREATE TABLE IF NOT EXISTS file_blobs (
  file_id UUID PRIMARY KEY,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expiry cleanup (run via Neon scheduled query or cron):
-- DELETE FROM transfers WHERE expires_at < now();
