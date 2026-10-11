export default function Progress({ value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)))
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}
