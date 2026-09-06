// GET /api/live-token
// Server-side only: calls the Go backend's /login with SS24 credentials
// and returns just the p_token. The browser uses this token to open its
// own socket.io connection to https://api.ss24.live — credentials never
// reach the browser.
//
// The upstream login only allows ONE active session at a time — logging
// in again while a token is still valid gets a 401 (session collision),
// not a credentials error. So we cache the token in memory and only call
// /login again once it's actually close to expiring.
//
// Hardcoded to match the known-working curl exactly:
//   curl -X POST "https://live-strean-production.up.railway.app/login" \
//     -H "Content-Type: application/json" \
//     -d '{"username": "AASTBAAA001", "password": "123123"}'

interface CachedToken {
  token: string
  expiresAt: number // ms epoch
}

let cached: CachedToken | null = null
let inFlight: Promise<string> | null = null

// Refresh this many seconds before actual expiry, so we never hand out
// a token that's about to die mid-use.
const REFRESH_MARGIN_SECONDS = 60

function decodeExp(jwt: string): number | null {
  try {
    const payload = jwt.split('.')[1]
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    return typeof json.exp === 'number' ? json.exp : null
  } catch {
    return null
  }
}

async function loginAndCache(): Promise<string> {
  const data = await $fetch<{ status: boolean; p_token: string }>(
    'https://live-strean-production.up.railway.app/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        username: 'AASTBAAA001',
        password: '123123',
      },
    }
  )

  if (!data?.status || !data?.p_token) {
    throw new Error('login response missing p_token')
  }

  const expSeconds = decodeExp(data.p_token)
  const expiresAt = expSeconds
    ? expSeconds * 1000 - REFRESH_MARGIN_SECONDS * 1000
    : Date.now() + 5 * 60 * 1000 // fallback: assume 5 min if exp can't be read

  cached = { token: data.p_token, expiresAt }
  return data.p_token
}

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token
  }

  // Multiple requests arriving while there's no valid cached token should
  // share one login call, not each trigger their own (that's exactly the
  // session-collision scenario above).
  if (!inFlight) {
    inFlight = loginAndCache().finally(() => {
      inFlight = null
    })
  }

  return inFlight
}

export default defineEventHandler(async () => {
  try {
    const p_token = await getToken()
    return { p_token }
  } catch (err) {
    // Respond 200 with p_token: null instead of throwing a 502. The
    // client checks for a missing p_token and falls back to showing the
    // thumbnail/error state gracefully — a thrown error response is one
    // more failure mode the client has to specially handle for the same
    // outcome, so keep this path simple and predictable.
    console.error('live-token proxy error:', err)
    return { p_token: null }
  }
})