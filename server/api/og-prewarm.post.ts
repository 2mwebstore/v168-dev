// POST /api/og-prewarm  { url }
//
// Asks Facebook's crawler to scrape (or re-scrape) one of our own pages so
// its Open Graph image is cached before the user actually shares it.
// Facebook fetches og:image asynchronously on the first scrape of a URL,
// which is why the first share of a brand-new video/fight sometimes shows
// no picture. Only runs when NUXT_FB_APP_TOKEN is configured; otherwise it
// returns { skipped: true } and the share still works normally.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.fbAppToken as string
  if (!token) return { skipped: true }

  const body = await readBody<{ url?: string }>(event).catch(() => ({} as { url?: string }))
  const target = (body?.url || '').trim()

  // Only scrape pages on the host that made the request — never act as an
  // open "scrape any URL" endpoint.
  const requestHost = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).host
  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid url' })
  }
  if (parsed.host !== requestHost || !/^\/(videos|fights)\/[^/]+$/.test(parsed.pathname)) {
    throw createError({ statusCode: 400, statusMessage: 'URL not allowed' })
  }

  try {
    await $fetch('https://graph.facebook.com/v19.0/', {
      method: 'POST',
      query: { id: parsed.toString(), scrape: 'true', access_token: token },
      timeout: 8000,
    })
    return { ok: true }
  } catch (err) {
    // Never surface this to the user — sharing must not depend on it.
    console.error('og-prewarm error:', err)
    return { ok: false }
  }
})
