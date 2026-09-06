<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const { t } = useLang()

const isLive = computed(() => route.path === '/')
const isVideos = computed(() => route.path.startsWith('/videos'))
const isFights = computed(() => route.path.startsWith('/fights'))

// t.me links normally land on Telegram's web "continue" page first.
// This tries the native tg:// app scheme directly (using the plain
// username from env), and only falls back to the t.me web link if the
// app doesn't actually open (desktop, app not installed, etc).
function openTelegram(e: MouseEvent) {
  const username = config.public.telegramUsername as string
  const webUrl = config.public.telegramUrl as string
  if (!username) return // no username configured, let the normal <a> href handle it

  e.preventDefault()
  const deepLink = `tg://resolve?domain=${username}`

  const start = Date.now()
  let fellBack = false

  const fallbackToWeb = () => {
    if (fellBack) return
    fellBack = true
    window.location.href = webUrl
  }

  // If the tab is still visible ~1.2s after trying the app scheme, the
  // app likely isn't installed (browsers suspend the page on a real
  // handoff), so drop back to the web link.
  const timer = setTimeout(() => {
    if (document.visibilityState === 'visible' && Date.now() - start < 2000) {
      fallbackToWeb()
    }
  }, 1200)

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  window.location.href = deepLink
}
</script>

<template>
  <div class="footer-nav-wrap">
    <nav class="footer-glass">
      <NuxtLink to="/" class="footer-tab" :class="{ active: isLive }">
        <span class="pulse-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
        <span>{{ t('live') }}</span>
      </NuxtLink>

      <NuxtLink to="/videos" class="footer-tab" :class="{ active: isVideos }" aria-label="Videos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
        <span>{{ t('videos') }}</span>
      </NuxtLink>

      <NuxtLink to="/fights" class="footer-tab" :class="{ active: isFights }" aria-label="List Fight">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
          <path d="M13 19l6-6"></path>
          <path d="M16 16l4 4"></path>
          <path d="M19 21l2-2"></path>
          <path d="M9.5 6.5L21 18v3h-3L6.5 9.5"></path>
        </svg>
        <span>{{ t('fight') }}</span>
      </NuxtLink>

      <a
        :href="config.public.telegramUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-tab footer-tab-telegram"
        aria-label="Join our Telegram"
        @click="openTelegram"
      >
        <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="120" cy="120" r="120" fill="#29A9EB" />
          <path
            fill="#fff"
            d="M181.5 68.5l-25.5 120.2c-1.9 8.6-7 10.7-14.2 6.7l-39.2-28.9-18.9 18.2c-2.1 2.1-3.9 3.9-7.9 3.9l2.8-40.1L164 84.7c3.5-3.1-.8-4.9-5.4-1.8l-89 56.1-38.4-12c-8.3-2.6-8.5-8.3 1.8-12.3l150.2-57.9c6.9-2.6 13 1.7 10.3 12.7z"
          />
        </svg>
      </a>
    </nav>
  </div>
</template>