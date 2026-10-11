import { formatBytes, fileEmoji } from '../../../shared/lib/format.js'
import { expiryLabel } from '../../../entities/transfer/helpers.js'

export default function TransferView({ transfer }) {
  if (!transfer) return null
  return (
    <div>
      <p className="muted small">{transfer.files.length} file{transfer.files.length > 1 ? 's' : ''} · {expiryLabel(transfer.expiresAt)}</p>
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
        {transfer.files.map((f) => (
          <li key={f.id || f.r2Key} className="file-row">
            <span className="file-icon" aria-hidden="true">{fileEmoji(f.mime)}</span>
            <span className="file-meta">
              <span className="file-name">{f.filename}</span>
              <br />
              <span className="small muted">{formatBytes(f.size)} · {f.mime}</span>
            </span>
            <a className="btn btn-secondary" href={f.getUrl} download={f.filename} target="_blank" rel="noreferrer">
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
