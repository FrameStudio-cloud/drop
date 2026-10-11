import { Router } from 'express'
import { newCode, newId, expiryDate } from '../lib/code.js'
import { HAS_NEON, dbAddFile, dbCodeExists, dbCreateTransfer, dbDeleteByCode, dbGetByCode } from '../lib/neon.js'
import { HAS_R2, presignedGet, presignedPut, r2KeyFor } from '../lib/r2.js'

const router = Router()

// Storage mode: R2 (unlimited) > Neon bytea (no card, ~25MB/file) > local disk (dev).
export const USE_NEON_BLOBS = HAS_NEON && !HAS_R2
const NEON_MAX_FILE = Number(process.env.NEON_MAX_FILE_MB || 25) * 1024 * 1024
const NEON_MAX_TOTAL = Number(process.env.NEON_MAX_TOTAL_MB || 100) * 1024 * 1024

// ---- local fallback store (no Neon / no R2) ----
// In-memory metadata + on-disk blobs under server/.data so `npm run dev`
// works with zero keys. Swap to Neon+R2 by setting env — same API.
const mem = new Map() // code -> { id, code, note, expiresAt, files: [] }
const byId = new Map()

async function uniqueCode() {
  for (let i = 0; i < 20; i++) {
    const c = newCode()
    const taken = HAS_NEON ? await dbCodeExists(c) : mem.has(c)
    if (!taken) return c
  }
  throw new Error('Could not allocate transfer code, try again')
}

function baseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol
  return `${proto}://${req.get('host')}`
}

// POST /api/transfers { files:[{filename,mime,size}], note, expiresInHrs }
router.post('/', async (req, res) => {
  try {
    const { files = [], note = '', expiresInHrs = 24 } = req.body || {}
    if (!Array.isArray(files) || !files.length || files.length > 20) {
      return res.status(400).json({ error: 'Send 1–20 files.' })
    }
    const total = files.reduce((n, f) => n + (Number(f.size) || 0), 0)
    if (USE_NEON_BLOBS && total > NEON_MAX_TOTAL) {
      return res.status(413).json({ error: `Neon mode: total over ${Math.round(NEON_MAX_TOTAL / 1024 / 1024)} MB. Delete old transfers or use smaller files.` })
    }
    if (!USE_NEON_BLOBS && total > 2 * 1024 * 1024 * 1024) return res.status(413).json({ error: 'Total over 2 GB limit.' })

    const id = newId()
    const code = await uniqueCode()
    const expiresAt = expiryDate(expiresInHrs)

    if (HAS_NEON) await dbCreateTransfer({ id, code, note, expiresAt })
    else {
      const rec = { id, code, note, expiresAt: expiresAt.toISOString(), files: [] }
      mem.set(code, rec)
      byId.set(id, rec)
    }
    req.app.locals.meta = { ...(req.app.locals.meta || {}), [id]: { code, expiresAt: expiresAt.toISOString() } }

    const uploadUrls = []
    for (const f of files) {
      const filename = String(f.filename || 'file').slice(0, 200)
      const mime = String(f.mime || 'application/octet-stream').slice(0, 120)
      const size = Math.max(0, Number(f.size) || 0)
      if (USE_NEON_BLOBS && size > NEON_MAX_FILE) {
        return res.status(413).json({ error: `"${filename}": Neon mode caps files at ${Math.round(NEON_MAX_FILE / 1024 / 1024)} MB. Compress it or split it.` })
      }
      const fileId = newId()
      const r2Key = r2KeyFor(id, filename)
      const putUrl = HAS_R2
        ? await presignedPut(r2Key, mime)
        : USE_NEON_BLOBS
          ? `${baseUrl(req)}/api/neon-blobs/${fileId}`
          : `${baseUrl(req)}/api/blobs/${encodeURIComponent(r2Key)}`
      uploadUrls.push({ fileId, r2Key, filename, putUrl })
      // stash pending meta for local mode; Neon inserts on complete
      if (!HAS_NEON) mem.get(code).pending = [...(mem.get(code).pending || []), { id: fileId, filename, mime, size, r2Key }]
      else req.app.locals.pending = { ...(req.app.locals.pending || {}), [fileId]: { filename, mime, size, r2Key, transferId: id } }
    }

    res.json({ id, code, expiresAt: expiresAt.toISOString(), uploadUrls })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Could not create transfer.' })
  }
})

// POST /api/transfers/:id/complete { files:[{fileId,r2Key}] }
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params
    // find record
    let rec = HAS_NEON ? null : byId.get(id)
    if (HAS_NEON) {
      const pending = req.app.locals.pending || {}
      const mine = Object.entries(pending).filter(([, v]) => v.transferId === id)
      for (const [fileId, v] of mine) {
        await dbAddFile({ id: fileId, transferId: id, filename: v.filename, mime: v.mime, size: v.size, r2Key: v.r2Key })
        delete pending[fileId]
      }
      const meta = (req.app.locals.meta || {})[id] || {}
      return res.json({ id, code: meta.code || '', expiresAt: meta.expiresAt || new Date().toISOString() })
    }
    if (!rec) return res.status(404).json({ error: 'Transfer not found.' })
    rec.files = [...(rec.pending || [])]
    delete rec.pending
    res.json({ id: rec.id, code: rec.code, expiresAt: rec.expiresAt })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Could not complete transfer.' })
  }
})

// GET /api/transfers/:code
router.get('/:code', async (req, res) => {
  try {
    const code = String(req.params.code).replace(/\D/g, '')
    if (HAS_NEON) {
      const found = await dbGetByCode(code)
      if (!found) return res.status(404).json({ error: 'No transfer with that code.' })
      if (found.expired) return res.status(410).json({ error: 'That code expired.' })
      const files = await Promise.all(found.files.map(async (f) => ({
        id: f.id,
        filename: f.filename,
        mime: f.mime,
        size: Number(f.size_bytes),
        getUrl: HAS_R2
          ? await presignedGet(f.r2_key)
          : USE_NEON_BLOBS
            ? `${baseUrl(req)}/api/neon-blobs/${f.id}`
            : `${baseUrl(req)}/api/blobs/${encodeURIComponent(f.r2_key)}`,
      })))
      return res.json({ id: found.transfer.id, code: found.transfer.code, note: found.transfer.note, expiresAt: found.transfer.expires_at, files })
    }
    const rec = mem.get(code)
    if (!rec) return res.status(404).json({ error: 'No transfer with that code. Check the digits?' })
    if (new Date(rec.expiresAt).getTime() < Date.now()) return res.status(410).json({ error: 'That code expired.' })
    res.json({
      id: rec.id, code: rec.code, note: rec.note, expiresAt: rec.expiresAt,
      files: rec.files.map((f) => ({
        id: f.id, filename: f.filename, mime: f.mime, size: f.size,
        getUrl: `${baseUrl(req)}/api/blobs/${encodeURIComponent(f.r2Key)}`,
      })),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Lookup failed.' })
  }
})

router.delete('/:code', async (req, res) => {
  const code = String(req.params.code).replace(/\D/g, '')
  if (HAS_NEON) {
    const n = await dbDeleteByCode(code)
    return res.json({ deleted: n })
  }
  const rec = mem.get(code)
  if (rec) { byId.delete(rec.id); mem.delete(code) }
  res.json({ deleted: rec ? 1 : 0 })
})

export default router
