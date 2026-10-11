export default function EmptyState({ title = 'Nothing here yet', hint = 'Files you send will show up here.', action }) {
  return (
    <div className="empty">
      <p style={{ fontSize: 34 }} aria-hidden="true">📦</p>
      <p style={{ fontWeight: 700, color: 'var(--label)' }}>{title}</p>
      <p className="small">{hint}</p>
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  )
}
