// Single source of truth for "codes remembered on this device".
// Lives in shared/ so features/history and features/storage can both use it
// without importing from each other (feature-independence rule).
const KEY = 'drop:history:v1'

export function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveRecent(entry) {
  try {
    const list = loadRecent().filter((e) => e.code !== entry.code)
    list.unshift({ ...entry, at: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)))
  } catch { /* storage full/blocked */ }
}

export function removeRecent(code) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadRecent().filter((e) => e.code !== code)))
  } catch { /* ignore */ }
}

export function clearRecent() {
  localStorage.removeItem(KEY)
}
