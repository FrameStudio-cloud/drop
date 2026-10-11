const BASE = import.meta.env.VITE_API_URL || ''

async function req(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  createTransfer: (payload) => req('/transfers', { method: 'POST', body: JSON.stringify(payload) }),
  completeTransfer: (id, payload) => req(`/transfers/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) }),
  getTransfer: (code) => req(`/transfers/${encodeURIComponent(code)}`),
  deleteTransfer: (code) => req(`/transfers/${encodeURIComponent(code)}`, { method: 'DELETE' }),
  storageUsage: () => req('/storage/usage'),
}
