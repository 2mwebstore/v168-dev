// GET /og/fight/:id.jpg   (route is /og/fight/:id — the .jpg suffix is
// part of the id param and stripped below; the extension is kept in the
// URL because Facebook/Telegram treat *.jpg links as images more reliably)
//
// Serves the Open Graph image for a fight detail page from our own domain,
// already resized to 1200x630 JPEG. The fight `thumbnail_link` from the
// admin panel is whatever was pasted there — often a full-size screenshot
// that is far larger than the crawlers accept (Telegram ignores images
// over ~5 MB, Facebook/Messenger over 8 MB and anything it can't fetch
// quickly), or a host that blocks bot user-agents / serves http only.
// Video `photo` values are small CDN thumbnails so they preview fine;
// fight thumbnails were not. Proxying + resizing here fixes all of those
// causes at once: the crawler always gets a small https JPEG from us.
import sharp from 'sharp'

const OG_W = 1200
const OG_H = 630
const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 200
const SOURCE_MAX_BYTES = 25 * 1024 * 1024

type CacheEntry = { buf: Buffer; at: number }
const cache = new Map<string, CacheEntry>()

// Same normalisation as toAbsoluteImageUrl() in composables/useApi.ts
// (kept local because Nuxt composables aren't available in Nitro routes).
function absoluteImageUrl(value: string, origin: string): string {
  let abs: string
  if (/^https?:\/\//i.test(value)) abs = value
  else if (value.startsWith('//')) abs = `https:${value}`
  else abs = `${origin}${value.startsWith('/') ? '' : '/'}${value}`
  try {
    return encodeURI(decodeURI(abs))
  } catch {
    return encodeURI(abs)
  }
}

function isPrivateHost(host: string) {
  return (
    host === 'localhost' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === '::1'
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = String(getRouterParam(event, 'id') || '').replace(/\.jpg$/i, '')
  if (!/^[\w-]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  }

  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'public, max-age=600, s-maxage=600')

  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    setHeader(event, 'Content-Length', hit.buf.length)
    return hit.buf
  }

  // 1. Look up the fight to get its thumbnail_link
  let thumbnail = ''
  try {
    const raw: any = await $fetch(`${config.public.apiBase}/fight/${encodeURIComponent(id)}`, {
      retry: 1,
      retryDelay: 300,
      timeout: 8000,
    })
    const fight = Array.isArray(raw) ? raw[0] : raw?.data ?? raw
    thumbnail = String(fight?.thumbnail_link || '').trim()
  } catch (err) {
    console.error('og fight lookup error:', err)
  }

  const requestUrl = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
  const fallback = `${requestUrl.origin}/v168.png`

  if (!thumbnail) {
    return sendRedirect(event, fallback, 302)
  }

  // 2. Resolve to an absolute, fetchable URL
  let src: URL
  try {
    src = new URL(absoluteImageUrl(thumbnail, requestUrl.origin))
  } catch {
    return sendRedirect(event, fallback, 302)
  }
  if (!/^https?:$/.test(src.protocol) || isPrivateHost(src.hostname)) {
    return sendRedirect(event, fallback, 302)
  }

  // 3. Download the original and resize it to the OG size
  try {
    const res = await fetch(src.toString(), {
      headers: {
        // some image hosts refuse requests without a browser-like UA
        'User-Agent': 'Mozilla/5.0 (compatible; V168 OG image proxy)',
        'Accept': 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const len = Number(res.headers.get('content-length') || 0)
    if (len > SOURCE_MAX_BYTES) throw new Error('source image too large')

    const input = Buffer.from(await res.arrayBuffer())
    if (input.length > SOURCE_MAX_BYTES) throw new Error('source image too large')

    const out = await sharp(input, { failOn: 'none' })
      .rotate() // honour EXIF orientation from phone screenshots
      .resize(OG_W, OG_H, { fit: 'cover', position: 'centre', withoutEnlargement: false })
      .flatten({ background: '#0b0f1a' }) // PNG transparency → solid
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toBuffer()

    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(id, { buf: out, at: Date.now() })

    setHeader(event, 'Content-Length', out.length)
    return out
  } catch (err) {
    console.error('og fight image error:', err)
    return sendRedirect(event, fallback, 302)
  }
})