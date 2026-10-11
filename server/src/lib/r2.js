export const HAS_R2 = Boolean(
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET,
)

let client = null
let PutObjectCommand = null
let GetObjectCommand = null
let getSignedUrl = null

async function ensureClient() {
  if (client) return client
  const s3 = await import('@aws-sdk/client-s3')
  const presigner = await import('@aws-sdk/s3-request-presigner')
  PutObjectCommand = s3.PutObjectCommand
  GetObjectCommand = s3.GetObjectCommand
  getSignedUrl = presigner.getSignedUrl
  const { S3Client } = s3
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
  return client
}

export function r2KeyFor(transferId, filename) {
  const safe = String(filename).replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120)
  return `transfers/${transferId}/${Date.now()}-${safe}`
}

export async function presignedPut(r2Key, mime) {
  await ensureClient()
  const cmd = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: r2Key, ContentType: mime })
  return getSignedUrl(client, cmd, { expiresIn: 3600 })
}

export async function presignedGet(r2Key) {
  await ensureClient()
  const cmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: r2Key })
  return getSignedUrl(client, cmd, { expiresIn: 3600 })
}
