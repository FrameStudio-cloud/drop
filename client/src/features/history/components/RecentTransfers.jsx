import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState } from '../../../shared/ui/index.js'
import { expiryLabel } from '../../../entities/transfer/helpers.js'
import { loadRecent, clearRecent } from '../../../shared/lib/recent.js'

export default function HistoryPage() {
  const [items, setItems] = useState(() => loadRecent())

  if (!items.length) {
    return (
      <Card title="History">
        <EmptyState title="No transfers yet" hint="Send something and its code will be remembered on this device." />
      </Card>
    )
  }

  return (
    <Card
      title="History"
      sub="Codes you created or opened on this device. Expiry is enforced server-side."
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((e) => (
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
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <Button variant="secondary" onClick={() => { clearRecent(); setItems([]) }}>
          Clear history
        </Button>
      </div>
    </Card>
  )
}
