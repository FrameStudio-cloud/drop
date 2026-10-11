import { useRef, useState } from 'react'

export default function FilePicker({ files, onAdd, onRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const addList = (list) => {
    const arr = Array.from(list || []).filter((f) => f.size > 0)
    if (arr.length) onAdd(arr)
  }

  return (
    <div>
      <div
        className={`dropzone${dragging ? ' dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Choose files to send"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addList(e.dataTransfer.files) }}
      >
        <div className="dz-title">Drop files here or tap to browse</div>
        <p className="muted small">Images, songs, videos, documents — up to your R2 / server limit.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => { addList(e.target.files); e.target.value = '' }}
        />
      </div>
      {files.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className="file-row">
              <span className="file-icon" aria-hidden="true">📦</span>
              <span className="file-meta">
                <span className="file-name">{f.name}</span>
                <br />
                <span className="small muted">{(f.size / 1024 / 1024).toFixed(2)} MB · {f.type || 'unknown type'}</span>
              </span>
              <button className="btn-plain btn" type="button" onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
