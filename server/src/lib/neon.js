import { neon } from '@neondatabase/serverless'

export const HAS_NEON = Boolean(process.env.DATABASE_URL)

let sql = null
if (HAS_NEON) {
  sql = neon(process.env.DATABASE_URL)
}

export async function dbCreateTransfer({ id, code, note, expiresAt }) {
  if (!HAS_NEON) return null
  await sql`
    INSERT INTO transfers (id, code, note, expires_at)
    VALUES (${id}, ${code}, ${note || null}, ${expiresAt.toISOString()})
  `
}

export async function dbAddFile({ id, transferId, filename, mime, size, r2Key }) {
  if (!HAS_NEON) return null
  await sql`
    INSERT INTO files (id, transfer_id, filename, mime, size_bytes, r2_key)
    VALUES (${id}, ${transferId}, ${filename}, ${mime}, ${size}, ${r2Key})
  `
}

export async function dbGetByCode(code) {
  if (!HAS_NEON) return null
  const rows = await sql`SELECT * FROM transfers WHERE code = ${code} LIMIT 1`
  if (!rows.length) return null
  const t = rows[0]
  if (new Date(t.expires_at).getTime() < Date.now()) return { expired: true }
  const files = await sql`SELECT * FROM files WHERE transfer_id = ${t.id} ORDER BY created_at ASC`
  return { transfer: t, files }
}

export async function dbDeleteByCode(code) {
  if (!HAS_NEON) return 0
  await sql`
    DELETE FROM file_blobs WHERE file_id IN (
      SELECT id FROM files WHERE transfer_id IN (SELECT id FROM transfers WHERE code = ${code})
    )
  `
  const rows = await sql`DELETE FROM transfers WHERE code = ${code} RETURNING id`
  return rows.length
}

// ---- Neon-only byte storage (no R2) ----
export async function dbPutBlob(fileId, buffer) {
  await sql`
    INSERT INTO file_blobs (file_id, data)
    VALUES (${fileId}, ${buffer})
    ON CONFLICT (file_id) DO UPDATE SET data = EXCLUDED.data
  `
}

export async function dbGetBlob(fileId) {
  const rows = await sql`
    SELECT b.data, f.filename, f.mime, f.size_bytes
    FROM file_blobs b LEFT JOIN files f ON f.id = b.file_id
    WHERE b.file_id = ${fileId} LIMIT 1
  `
  return rows[0] || null
}

export async function dbCodeExists(code) {
  if (!HAS_NEON) return false
  const rows = await sql`SELECT 1 FROM transfers WHERE code = ${code} LIMIT 1`
  return rows.length > 0
}

// ---- storage meter: totals only, no codes (safe to expose) ----
export async function dbUsage() {
  const t = await sql`SELECT COUNT(*)::int AS n FROM transfers`
  const f = await sql`SELECT COUNT(*)::int AS n, COALESCE(SUM(size_bytes),0)::bigint AS bytes FROM files`
  const b = await sql`SELECT COUNT(*)::int AS n, COALESCE(SUM(octet_length(data)),0)::bigint AS bytes FROM file_blobs`
  return {
    transfers: t[0]?.n ?? 0,
    files: f[0]?.n ?? 0,
    declaredBytes: Number(f[0]?.bytes ?? 0),
    blobBytes: Number(b[0]?.bytes ?? 0),
    blobObjects: b[0]?.n ?? 0,
  }
}
