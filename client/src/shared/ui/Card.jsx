export default function Card({ title, sub, children, ...props }) {
  return (
    <section className="card" {...props}>
      {title ? <h2>{title}</h2> : null}
      {sub ? <p className="muted">{sub}</p> : null}
      {children}
    </section>
  )
}
