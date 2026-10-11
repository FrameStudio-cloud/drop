import { Progress } from '../../../shared/ui/index.js'

export default function UploadProgress({ items }) {
  if (!items.length) return null
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      {items.map((it) => (
        <div key={it.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="small">
            <span>{it.name}</span>
            <span className="muted">{Math.round(it.pct)}%</span>
          </div>
          <Progress value={it.pct} />
        </div>
      ))}
    </div>
  )
}
