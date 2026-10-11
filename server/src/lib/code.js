import crypto from 'node:crypto'

export function newId() {
  return crypto.randomUUID()
}

// 6-digit numeric code, no confusing 0/O — digits only for phone keyboards.
export function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function expiryDate(hours = 24) {
  const h = Math.min(Math.max(Number(hours) || 24, 1), 72)
  return new Date(Date.now() + h * 3600_000)
}
