import { useState } from 'react'
import { Button, Card } from '../../../shared/ui/index.js'
import QRCodeCard from '../../qr-share/index.jsx'
import FilePicker from './FilePicker.jsx'
import UploadProgress from './UploadProgress.jsx'
import { useSend } from '../hooks/useSend.js'

export default function SendPage() {
  const [files, setFiles] = useState([])
  const { status, progress, result, error, send, reset } = useSend()

  const add = (arr) => setFiles((f) => [...f, ...arr].slice(0, 20))
  const remove = (i) => setFiles((f) => f.filter((_, j) => j !== i))

  if (result) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <Card title="Sent — share this code" sub="Enter it on your other device. No cable needed.">
          <QRCodeCard code={result.code} />
        </Card>
        <Button variant="secondary" onClick={() => { reset(); setFiles([]) }}>
          Send more files
        </Button>
      </div>
    )
  }

  return (
    <Card title="Send files" sub="Pick from this device, get a code, open it on the other one.">
      <FilePicker files={files} onAdd={add} onRemove={remove} />
      <UploadProgress items={progress} />
      {error ? <p style={{ color: 'var(--danger)' }} role="alert">{error}</p> : null}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button disabled={!files.length || status === 'uploading'} onClick={() => send(files)}>
          {status === 'uploading' ? 'Sending…' : `Send ${files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''}`}
        </Button>
        {files.length ? (
          <Button variant="secondary" onClick={() => setFiles([])}>
            Clear
          </Button>
        ) : null}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        Files expire after 24 hours and are fetched with a short numeric code — nobody needs an account.
      </p>
    </Card>
  )
}
