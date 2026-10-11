import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import transfers from './routes/transfers.js'
import storage from './routes/storage.js'
import { HAS_NEON, dbGetBlob, dbPutBlob } from './lib/neon.js'
import { HAS_R2 } from './lib/r2.js'

const USE_NEON_BLOBS = HAS_NEON && !HAS_R2
const NEON_MAX_FILE = Number(process.env.NEON_MAX_FILE_MB || 25) * 1024 * 1024

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '..', '.data')
fs.mkdirSync(DATA, { recursive: true })

const app = express()
app.set('trust proxy', true)
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Neon bytea store — file bytes live in Postgres, no R2/card needed.
// PUT /api/neon-blobs/:fileId (raw bytes) / GET streams back.
app.put('/api/neon-blobs/:fileId', express.raw({ type: '*/*', limit: '30mb' }), async (req, res) => {
  if (!USE_NEON_BLOBS) return res.status(400).json({ error: 'Neon blob mode is off.' })
  const buf = req.body || Buffer.alloc(0)
  if (!buf.length) return res.status(400).json({ error: 'Empty upload.' })
  if (buf.length > NEON_MAX_FILE) return res.status(413).json({ error: 'File over Neon 25 MB cap.' })
  try {
    await dbPutBlob(String(req.params.fileId), buf)
    res.json({ ok: true, size: buf.length, storage: 'neon' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Neon write failed.' })
  }
})

app.get('/api/neon-blobs/:fileId', async (req, res) => {
  if (!HAS_NEON) return res.status(404).send('Not found')
  try {
    const row = await dbGetBlob(String(req.params.fileId))
    if (!row) return res.status(404).send('Not found')
    res.setHeader('Content-Type', row.mime || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${String(row.filename || 'file').replace(/"/g, '')}"`)
    res.send(row.data)
  } catch (e) {
    console.error(e)
    res.status(500).send('Read failed')
  }
})

// Local blob store — only used with neither R2 nor Neon.
// PUT /api/blobs/:key (raw bytes) / GET streams back. Keys are transfer-scoped.
app.put('/api/blobs/:key', express.raw({ type: '*/*', limit: '500mb' }), (req, res) => {
  if (HAS_R2) return res.status(400).json({ error: 'Blobs go direct to R2 in cloud mode.' })
  const key = String(req.params.key)
  if (!key.startsWith('transfers/') || key.includes('..')) return res.status(400).json({ error: 'Bad key.' })
  const file = path.join(DATA, key.replace(/\//g, '__'))
  fs.writeFileSync(file, req.body || Buffer.alloc(0))
  res.json({ ok: true, size: (req.body || []).length })
})

app.get('/api/blobs/:key', (req, res) => {
  const key = String(req.params.key)
  const file = path.join(DATA, key.replace(/\//g, '__'))
  if (!fs.existsSync(file)) return res.status(404).send('Not found')
  res.sendFile(file)
})

app.use('/api/transfers', transfers)
app.use('/api/storage', storage)
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  neon: HAS_NEON,
  r2: HAS_R2,
  storage: HAS_R2 ? 'r2' : HAS_NEON ? 'neon' : 'local',
}))

const PORT = Number(process.env.PORT) || 4000
app.listen(PORT, () => {
  console.log(`drop server on :${PORT} — storage:${HAS_R2 ? 'r2' : HAS_NEON ? 'neon-bytea' : 'local-disk'}`)
})
