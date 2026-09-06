export function useApiBase() {
  const config = useRuntimeConfig()
  return config.public.apiBase
}

// Compares a date string against "today" in Cambodia time (Asia/Phnom_Penh),
// not the visitor's local time — used by the Today filters on Videos/Fights.
const phnomPenhDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Phnom_Penh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function parseApiDate(str?: string | null): Date | null {
  if (!str) return null
  const iso = str.includes('T') ? str : str.replace(' ', 'T')
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

export function isTodayInPhnomPenh(str?: string | null): boolean {
  const d = parseApiDate(str)
  if (!d) return false
  return phnomPenhDateFmt.format(d) === phnomPenhDateFmt.format(new Date())
}

export function timeAgo(str?: string | null): string {
  const d = parseApiDate(str)
  if (!d) return ''
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

// Facebook's crawler requires og:image (and twitter:image) to be a fully
// qualified, absolute URL — it will not resolve a relative path against
// the page it's scraping. Admin-entered image links (video `photo`,
// fight `thumbnail_link`) are free-text fields, so there's no guarantee
// they were saved as absolute URLs, or that they don't contain spaces /
// non-ASCII characters (Khmer file names, "my photo.jpg", etc). A raw
// space or Khmer character inside <meta property="og:image"> is enough
// for Facebook's and Telegram's crawlers to fail the image fetch, which
// shows up as "shared, but no picture". This normalizes whatever comes
// back from the API into something the crawlers can actually fetch:
//   - already absolute (http/https) → used as-is
//   - protocol-relative ("//cdn...") → given https
//   - site-relative ("/uploads/x.jpg") → prefixed with the request origin
//   - empty/missing → falls back to the provided default
//   - always percent-encoded (idempotent — already-encoded URLs stay as-is)
export function toAbsoluteImageUrl(path: string | null | undefined, origin: string, fallback: string): string {
  const value = path?.trim()
  if (!value) return fallback
  let abs: string
  if (/^https?:\/\//i.test(value)) abs = value
  else if (value.startsWith('//')) abs = `https:${value}`
  else abs = `${origin}${value.startsWith('/') ? '' : '/'}${value}`
  return encodeImageUrl(abs)
}

function encodeImageUrl(url: string): string {
  try {
    // decode first so an already-encoded URL isn't double-encoded (%20 → %2520)
    return encodeURI(decodeURI(url))
  } catch {
    return encodeURI(url)
  }
}

// The origin (scheme + host) of the page as the visitor / crawler actually
// requested it. Production serves several domains from one Nuxt instance
// behind Nginx, so this must come from the request — not a fixed config
// value. Plain useRequestURL() ignores X-Forwarded-Host / X-Forwarded-Proto,
// which behind a reverse proxy yields "http://..." (or the upstream host)
// during SSR; og:url / og:image would then point at a URL the crawler can't
// or won't use. Requires Nginx to send:
//   proxy_set_header Host $host;
//   proxy_set_header X-Forwarded-Host $host;
//   proxy_set_header X-Forwarded-Proto $scheme;
export function useSiteOrigin() {
  const requestUrl = useRequestURL({ xForwardedHost: true, xForwardedProto: true })
  return requestUrl.origin
}
