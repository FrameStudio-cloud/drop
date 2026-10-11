import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

export default function QRCodeCard({ code }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/r/${code}`
  const pretty = `${code.slice(0, 3)} ${code.slice(3)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${pretty} — ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-l)', padding: 20, textAlign: 'center' }}>
      <div className="code-display" aria-label={`Transfer code ${pretty}`}>{pretty}</div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 12px', background: '#fff', padding: 12, borderRadius: 12 }}>
        <QRCodeSVG value={url} size={168} aria-label={`QR code for ${url}`} />
      </div>
      <p className="small muted" style={{ overflowWrap: 'anywhere' }}>{url}</p>
      <button className="btn btn-secondary" type="button" onClick={copy} style={{ marginTop: 12 }}>
        {copied ? 'Copied ✓' : 'Copy code + link'}
      </button>
    </div>
  )
}
