// POST /api/stream
// Proxies the live-stream resolver so the browser never sees or calls that
// URL directly. Body is passed straight through: { streamName, channelName, dataId }.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  try {
    return await $fetch(config.streamResolverUrl, {
      method: 'POST',
      body,
    })
  } catch (err) {
    console.error('stream resolver proxy error:', err)
    throw createError({ statusCode: 502, statusMessage: 'Failed to resolve stream' })
  }
})
