import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card } from '../../../shared/ui/index.js'
import CodeInput from './CodeInput.jsx'
import TransferView from './TransferView.jsx'
import { useReceive } from '../hooks/useReceive.js'

export default function ReceivePage() {
  const { code: routeCode } = useParams()
  const { code, setCode, status, transfer, error, fetchByCode } = useReceive(routeCode || '')

  useEffect(() => {
    if (routeCode && routeCode.replace(/\D/g, '').length === 6) fetchByCode(routeCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCode])

  return (
    <Card title="Receive files" sub="Type the 6-digit code from your other device.">
      <CodeInput value={code} onChange={setCode} />
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button disabled={code.replace(/\D/g, '').length !== 6 || status === 'loading'} onClick={() => fetchByCode(code)}>
          {status === 'loading' ? 'Looking…' : 'Find transfer'}
        </Button>
      </div>
      {error ? <p style={{ color: 'var(--danger)' }} role="alert">{error}</p> : null}
      {status === 'done' && transfer ? (
        <div style={{ marginTop: 16 }}>
          <TransferView transfer={transfer} />
        </div>
      ) : null}
    </Card>
  )
}
