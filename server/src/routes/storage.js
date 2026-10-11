import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HAS_NEON, dbUsage } from '../lib/neon.js'
import { HAS_R2 } from '../lib/r2.js'

const router = Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '..', '.data')

// GET /api/storage/usage -> totals only (no codes, safe to expose)
router.get('/usage', async (_req, res) => {
  try {
    const quotaMb = Number(process.env.NEON_QUOTA_MB || 512)
    if (HAS_NEON) {
      const u = await dbUsage()
      return res.json({
        storage: HAS_R2 ? 'r2' : 'neon',
        ...u,
        // in R2 mode bytes live outside Postgres; declared sum is the meter
        meteredBytes: HAS_R2 ? u.declaredBytes : u.blobBytes,
        quotaBytes: quotaMb * 1024 * 1024,
        quotaNote: HAS_R2
          ? 'R2 metering: file sizes only (bucket metered by Cloudflare).'
          : `Neon free tier ≈ ${quotaMb} MB. Delete old transfers to free space.`,
      })
    }
    // local dev fallback: size the .data dir
    let bytes = 0
    let objects = 0
    try {
      for (const f of fs.readdirSync(DATA)) {
        const st = fs.statSync(path.join(DATA, f))
        if (st.isFile()) { bytes += st.size; objects += 1 }
      }
    } catch { /* no dir yet */ }
    res.json({
      storage: 'local',
      transfers: 0,
      files: objects,
      declaredBytes: bytes,
      blobBytes: bytes,
      blobObjects: objects,
      meteredBytes: bytes,
      quotaBytes: null,
      quotaNote: 'Local dev mode — files live in server/.data on this machine.',
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Usage check failed.' })
  }
})

export default router
