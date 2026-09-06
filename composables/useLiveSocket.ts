// Connects directly to the ss24 socket.io API (https://api.ss24.live) using
// a p_token fetched server-side from /api/live-token, and resolves the
// live iframe URL the same way get-stream-url.js does — this mirrors that
// script's flow exactly (same auth shape, same emit, same events).
//
// Single attempt, no retries: connect, wait for the URL, hand it back.
// The caller is responsible for showing a thumbnail/loading state until
// onUrl fires.

import type { Socket } from 'socket.io-client'

const TIMEOUT_MS = 15000

interface WatchTarget {
  channelId: string
  streamName: string
}

function extractUrl(payload: unknown): string | null {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const candidate = p.data || p.liveUrl || p.url
  return typeof candidate === 'string' ? candidate : null
}

export function useLiveSocket() {
  const config = useRuntimeConfig()

  let socket: Socket | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  async function fetchToken(): Promise<string | null> {
    const { p_token } = await $fetch<{ p_token: string | null }>('/api/live-token')
    return p_token
  }

  async function playViaSocket(
    target: WatchTarget,
    onUrl: (url: string) => void,
    onError: (message: string) => void
  ) {
    cleanup()

    let token: string | null
    try {
      token = await fetchToken()
    } catch (err) {
      console.error('live-token fetch failed:', err)
      onError('streamUnavailable')
      return
    }

    if (!token) {
      // Login failed or returned no p_token — show the thumbnail/error
      // state and stop here. Never attempt the socket without a token.
      console.error('live-token: no p_token available (login failed)')
      onError('streamUnavailable')
      return
    }

    const { io } = await import('socket.io-client')
    const channelId = parseInt(target.channelId, 10)

    socket = io(config.public.liveSocketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token, channelId },
    })

    timer = setTimeout(() => {
      console.error('live socket: no stream URL within', TIMEOUT_MS, 'ms')
      onError('streamUnavailable')
      cleanup()
    }, TIMEOUT_MS)

    socket.on('connect_error', (err) => {
      console.error('live socket connect_error:', err)
      onError('streamUnavailable')
      cleanup()
    })

    socket.on('AUTH_FAILED', (payload) => {
      console.error('live socket AUTH_FAILED:', payload)
      onError('streamUnavailable')
      cleanup()
    })

    socket.on('connect', () => {
      setTimeout(() => {
        socket?.emit('PLAYER_SWITCH_CHANNEL', { channelId })
      }, 1000)
    })

    function handleCandidate(payload: unknown) {
      const url = extractUrl(payload)
      if (url && url.includes(target.streamName)) {
        if (timer) clearTimeout(timer)
        onUrl(url)
      }
    }

    for (const evt of ['LIVE_URL', 'CHANNEL_URL', 'REFRESH_VIDEO']) {
      socket.on(evt, handleCandidate)
    }

    // INITIALIZE nests the URL under liveUrl.
    socket.on('INITIALIZE', (payload: { liveUrl?: string }) => {
      if (payload?.liveUrl) {
        handleCandidate({ data: payload.liveUrl })
      }
    })
  }

  function cleanup() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    socket?.disconnect()
    socket = null
  }

  return { playViaSocket, cleanup }
}