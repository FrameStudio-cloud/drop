import { useCallback, useState } from 'react'
import { api } from '../../../shared/lib/api-client.js'
import { uploadWithProgress } from '../../../shared/lib/r2-upload.js'
import { saveRecent } from '../../../shared/lib/recent.js'

export function useSend() {
  const [state, setState] = useState({ status: 'idle', progress: [], result: null, error: null })

  const send = useCallback(async (files, { note = '', expiresInHrs = 24 } = {}) => {
    if (!files.length) return
    setState({ status: 'uploading', progress: files.map((f) => ({ name: f.name, pct: 0 })), result: null, error: null })
    try {
      const created = await api.createTransfer({
        files: files.map((f) => ({ filename: f.name, mime: f.type || 'application/octet-stream', size: f.size })),
        note,
        expiresInHrs,
      })
      await Promise.all(
        created.uploadUrls.map((u, i) =>
          uploadWithProgress(u.putUrl, files[i], files[i].type, (pct) =>
            setState((s) => ({
              ...s,
              progress: s.progress.map((p, j) => (j === i ? { ...p, pct } : p)),
            })),
          ),
        ),
      )
      const done = await api.completeTransfer(created.id, {
        files: created.uploadUrls.map((u) => ({ fileId: u.fileId, r2Key: u.r2Key })),
      })
      saveRecent({ code: done.code, expiresAt: done.expiresAt, count: files.length })
      setState((s) => ({ ...s, status: 'done', result: done }))
      return done
    } catch (e) {
      setState((s) => ({ ...s, status: 'error', error: e.message }))
      throw e
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle', progress: [], result: null, error: null }), [])

  return { ...state, send, reset }
}
