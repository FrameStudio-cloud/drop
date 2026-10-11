import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Progress } from '../../../shared/ui/index.js'
import { api } from '../../../shared/lib/api-client.js'
import { formatBytes, normalizeCode } from '../../../shared/lib/format.js'
import { expiryLabel } from '../../../entities/transfer/helpers.js'
import { loadRecent, removeRecent } from '../../../shared/lib/recent.js'
import { useStorageUsage } from '../hooks/useStorage.js'

function MeterBar({ used, quota }) {
  if (!quota) return <Progress value={0} />
  const pct = Math.min(100, (used / quota) * 100)
  const hot = pct >= 90
  return (
    <div>
      <Progress value={pct} />
      <p className="small" style={{ color: hot ? 'var(--danger)' : 'var(--label-2)', marginTop: 6 }}>
        {formatBytes(used)} of {formatBytes(quota)} used ({Math.round(pct)}%)
        {hot ? ' — nearly full, delete old transfers below.' : ''}
      </p>
    </div>
  )
}

export default function StoragePage() {
  const { status, usage, error, refresh } = useStorageUsage()
  const [recent, setRecent] = useState(() => loadRecent())
  const [manualCode, setManualCode] = useState('')
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)

  const drop = async (code) => {
    const clean = normalizeCode(code)
    if (clean.length !== 6) { setMsg({ kind: 'error', text: 'Enter all 6 digits.' }); return }
    setBusy(clean)
    setMsg(null)
    try {
      await api.deleteTransfer(clean)
      removeRecent(clean)
      setRecent(loadRecent())
      setMsg({ kind: 'ok', text: `Transfer ${clean.slice(0, 3)} ${clean.slice(3)} deleted — space freed.` })
      refresh()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Storage" sub="How much of your Neon DB your files are using.">
        {status === 'loading' ? <p className="muted">Checking usage…</p> : null}
        {status === 'error' ? (
          <div>
            <p style={{ color: 'var(--danger)' }} role="alert">{error}</p>
            <Button variant="secondary" onClick={refresh}>Retry</Button>
          </div>
        ) : null}
        {status === 'done' && usage ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <MeterBar used={usage.meteredBytes} quota={usage.quotaBytes} />
            <p className="small muted">
              {usage.transfers} transfer{usage.transfers === 1 ? '' : 's'} · {usage.files} file{usage.files === 1 ? '' : 's'} ·{' '}
              mode: {usage.storage === 'neon' ? 'Neon bytea (no card)' : usage.storage === 'r2' ? 'Cloudflare R2' : 'local dev disk'}
            </p>
            <p className="small muted">{usage.quotaNote}</p>
            <div>
              <Button variant="secondary" onClick={refresh}>Refresh</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card
        title="Free space"
        sub="Delete a transfer to remove its files for everyone. Codes you made on this device are listed — or type any code."
      >
        {recent.length ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {recent.map((e) => (
              <li key={e.code} className="file-row">
                <span className="file-icon" aria-hidden="true">🔑</span>
                <span className="file-meta">
                  <Link to={`/r/${e.code}`} style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {String(e.code).slice(0, 3)} {String(e.code).slice(3)}
                  </Link>
                  <br />
                  <span className="small muted">
                    {e.count ? `${e.count} file${e.count > 1 ? 's' : ''} · ` : ''}{expiryLabel(e.expiresAt)}
                  </span>
                </span>
                <button
                  className="btn-plain btn"
                  type="button"
                  disabled={busy === e.code}
                  onClick={() => drop(e.code)}
                  aria-label={`Delete transfer ${e.code}`}
                  style={{ color: 'var(--danger)' }}
                >
                  {busy === e.code ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No remembered codes" hint="Type a 6-digit code below to delete that transfer." />
        )}

        <form
          style={{ display: 'flex', gap: 8, marginTop: 16 }}
          onSubmit={(e) => { e.preventDefault(); drop(manualCode); setManualCode('') }}
        >
          <input
            className="field"
            inputMode="numeric"
            placeholder="123 456"
            aria-label="Transfer code to delete"
            value={manualCode}
            onChange={(e) => setManualCode(normalizeCode(e.target.value))}
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
          <Button type="submit" variant="secondary" disabled={busy !== null}>
            Delete
          </Button>
        </form>

        {msg ? (
          <p role={msg.kind === 'error' ? 'alert' : 'status'} style={{ color: msg.kind === 'error' ? 'var(--danger)' : 'var(--success)' }}>
            {msg.text}
          </p>
        ) : null}
      </Card>
    </div>
  )
}
