import { useEffect, useRef } from 'react'
import { normalizeCode } from '../../../shared/lib/format.js'

export default function CodeInput({ value, onChange }) {
  const boxes = useRef([])
  const digits = (value || '').padEnd(6, ' ').slice(0, 6).split('')

  useEffect(() => { boxes.current[0]?.focus() }, [])

  const setDigit = (i, d) => {
    const next = normalizeCode((value || '').split('').map((c, j) => (j === i ? d : c)).join('') + d)
    // simpler: rebuild from boxes
    const arr = digits.slice()
    arr[i] = d
    onChange(normalizeCode(arr.join('')))
  }

  return (
    <div className="code-grid" role="group" aria-label="6-digit transfer code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { boxes.current[i] = el }}
          className="code-box"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          placeholder="–"
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1)
            if (!v) { setDigit(i, ''); return }
            setDigit(i, v)
            boxes.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i].trim()) boxes.current[i - 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            onChange(normalizeCode(e.clipboardData.getData('text')))
          }}
        />
      ))}
    </div>
  )
}
