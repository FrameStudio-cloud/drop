import { useCallback, useEffect, useState } from 'react'
import { api } from '../../../shared/lib/api-client.js'

export function useStorageUsage() {
  const [state, setState] = useState({ status: 'loading', usage: null, error: null })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const usage = await api.storageUsage()
      setState({ status: 'done', usage, error: null })
    } catch (e) {
      setState({ status: 'error', usage: null, error: e.message })
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { ...state, refresh }
}
