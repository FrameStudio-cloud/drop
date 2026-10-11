export function isExpired(expiresAt) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

export function expiryLabel(expiresAt) {
  if (!expiresAt) return 'No expiry'
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return 'Expires within the hour'
  if (h < 24) return `Expires in ${h}h`
  return `Expires in ${Math.floor(h / 24)}d`
}
