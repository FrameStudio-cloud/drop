export default function Button({ variant = 'primary', ...props }) {
  const cls = variant === 'primary' ? 'btn btn-primary' : variant === 'secondary' ? 'btn btn-secondary' : 'btn-plain btn'
  return <button className={cls} {...props} />
}
