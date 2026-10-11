import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlFile = path.join(__dirname, '..', '..', 'db', 'schema.sql')
const sqlText = fs.readFileSync(sqlFile, 'utf8')
const sql = neon(process.env.DATABASE_URL)

// split on semicolons not inside strings — schema is simple, plain split is fine
const statements = sqlText.split(';').map((s) => s.trim()).filter((s) => s && !s.startsWith('-- drop') && !s.startsWith('-- Expiry') && !s.startsWith('-- DELETE'))
for (const stmt of statements) {
  await sql(stmt)
}
const tables = await sql(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('transfers','files','file_blobs') ORDER BY 1`)
console.log(JSON.stringify({ ok: true, tables: tables.map((t) => t.tablename) }))
