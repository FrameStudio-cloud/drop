import { useCallback, useState } from 'react'
import { api } from '../../../shared/lib/api-client.js'

export function useReceive(initialCode = '') {
  const [code, setCode] = useState(initialCode)
  const [state, setState] = useState({ status: 'idle', transfer: null, error: null })

  const fetchByCode = useCallback(async (c) => {
    const clean = (c || '').replace(/\D/g, '')
    if (clean.length !== 6) { setState({ status: 'error', transfer: null, error: 'Enter all 6 digits.' }); return }
    setState({ status: 'loading', transfer: null, error: null })
    try {
      const t = await api.getTransfer(clean)
      setState({ status: 'done', transfer: t, error: null })
    } catch (e) {
      setState({ status: 'error', transfer: null, error: e.message })
    }
  }, [])

  return { code, setCode, ...state, fetchByCode }
}
