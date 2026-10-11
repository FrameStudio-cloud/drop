import { useState } from 'react'

const KEY = 'drop:device-name'

export function getDeviceName() {
  return localStorage.getItem(KEY) || ''
}

// Reserved for v2 (P2P / trusted devices). Today: just a friendly nickname
// shown in the header and sent as X-Device-Name. Independent module —
// safe to extend without touching send/receive.
export default function DeviceNick({ compact }) {
  const [name, setName] = useState(() => getDeviceName())
  const [editing, setEditing] = useState(false)

  const save = (v) => {
    const clean = v.slice(0, 24)
    setName(clean)
    if (clean) localStorage.setItem(KEY, clean)
    else localStorage.removeItem(KEY)
  }

  if (compact && !editing && name) {
    return (
      <button className="btn-plain btn small" type="button" onClick={() => setEditing(true)} title="Rename this device">
        📱 {name}
      </button>
    )
  }

  return (
    <label className="device-nick">
      📱
      <input
        className="field"
        placeholder="Name this device"
        value={editing || !compact ? name : name}
        onChange={(e) => save(e.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        maxLength={24}
      />
    </label>
  )
}
