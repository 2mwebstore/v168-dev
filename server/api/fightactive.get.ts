// GET /api/fightactive
// Proxies admin.cf88.me's active-fight endpoint so the browser never sees
// or calls that URL directly, and so it's easy to add caching here later.
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  try {
    return await $fetch(`${config.adminApiBase}/fightactive`)
  } catch (err) {
    console.error('fightactive proxy error:', err)
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch active fight' })
  }
})
