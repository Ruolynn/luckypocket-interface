import { hmac } from 'k6/crypto'
import encoding from 'k6/encoding'

function toBase64Url(str) {
  return str.replace(/=+/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlEncodeString(input) {
  return toBase64Url(encoding.b64encode(input))
}

export function generateJwt(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncodeString(JSON.stringify(header))
  const encodedPayload = base64UrlEncodeString(JSON.stringify(fullPayload))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = hmac('sha256', secret, data, 'base64')
  const encodedSignature = toBase64Url(signature)

  return `${data}.${encodedSignature}`
}

export function getEnvArray(name, fallback = []) {
  const raw = __ENV[name]
  if (!raw) return fallback
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function pickRandom(items) {
  if (!items || items.length === 0) return null
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

export function buildAuthHeader(overrides = {}) {
  const secret = overrides.secret || __ENV.JWT_SECRET || 'dev_secret_change_me'
  const userId = overrides.userId || __ENV.JWT_USER_ID || 'loadtest-user'
  const address = (overrides.address || __ENV.JWT_ADDRESS || '0x0000000000000000000000000000000000000000').toLowerCase()
  const expires = Number(overrides.expiresIn || __ENV.JWT_EXPIRES_IN || 3600)

  const token = generateJwt({ userId, address }, secret, expires)
  return `Bearer ${token}`
}

export function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes)
  for (let i = 0; i < bytes; i += 1) {
    arr[i] = Math.floor(Math.random() * 256)
  }
  return `0x${Array.from(arr)
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}
