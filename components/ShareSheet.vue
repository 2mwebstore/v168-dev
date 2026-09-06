<script setup lang="ts">
const { open, url, title, closeShareSheet } = useShareSheet()
const { t } = useLang()
const config = useRuntimeConfig()

const copied = ref(false)

// Ask Facebook to scrape the page as soon as the sheet opens (before the
// user has even picked Facebook/Messenger). Facebook's first scrape of a
// never-shared URL fetches the image asynchronously, so the first share
// often shows no picture; pre-scraping means the image is already cached
// by the time the share dialog renders. No-op unless NUXT_FB_APP_TOKEN is
// set on the server — see server/api/og-prewarm.post.ts.
watch(open, (isOpen) => {
  if (!isOpen || !url.value) return
  $fetch('/api/og-prewarm', { method: 'POST', body: { url: url.value } }).catch(() => {})
})

// Generic "try the native app deep link, fall back to a web URL if the
// app didn't take over" — used by both Telegram and Messenger.
function openDeepLinkWithFallback(deepLink: string, webUrl: string) {
  const start = Date.now()
  let fellBack = false

  const fallbackToWeb = () => {
    if (fellBack) return
    fellBack = true
    window.open(webUrl, '_blank', 'noopener,noreferrer')
  }

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

function close() {
  closeShareSheet()
  copied.value = false
}

const telegramShareUrl = computed(() => {
  const params = new URLSearchParams({ url: url.value, text: title.value })
  return `https://t.me/share/url?${params.toString()}`
})

// t.me/share/url always opens Telegram's web share page first. Try the
// native tg:// deep link (which opens the app's own share/forward sheet
// directly) and only fall back to the web share URL if the app doesn't
// actually take over (desktop, app not installed, etc).
function onTelegramClick(e: MouseEvent) {
  e.preventDefault()
  const params = new URLSearchParams({ url: url.value, text: title.value })
  openDeepLinkWithFallback(`tg://msg_url?${params.toString()}`, telegramShareUrl.value)
  close()
}

const facebookShareUrl = computed(() => {
  const params = new URLSearchParams({ u: url.value })
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`
})

// Messenger. On phones the fb-messenger:// deep link opens the Messenger
// app's own "send to" sheet and needs no app id. On desktop the only web
// entry point is Facebook's Send Dialog, which requires a Facebook App ID
// (NUXT_PUBLIC_FB_APP_ID). Without one, desktop falls back to the normal
// Facebook share dialog so the button still does something useful.
const fbAppId = computed(() => (config.public.fbAppId as string) || '')

const messengerWebUrl = computed(() => {
  if (!fbAppId.value) return facebookShareUrl.value
  const params = new URLSearchParams({
    link: url.value,
    app_id: fbAppId.value,
    redirect_uri: url.value,
  })
  return `https://www.facebook.com/dialog/send?${params.toString()}`
})

function onMessengerClick(e: MouseEvent) {
  e.preventDefault()
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (isMobile) {
    const params = new URLSearchParams({ link: url.value })
    if (fbAppId.value) params.set('app_id', fbAppId.value)
    openDeepLinkWithFallback(`fb-messenger://share?${params.toString()}`, messengerWebUrl.value)
  } else {
    window.open(messengerWebUrl.value, '_blank', 'noopener,noreferrer')
  }
  close()
}

async function copyLink() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url.value)
    } else {
      const el = document.createElement('textarea')
      el.value = url.value
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copied.value = true
    setTimeout(close, 1100)
  } catch (err) {
    console.error('Copy link failed:', err)
  }
}

onMounted(() => {
  const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
  document.addEventListener('keydown', onKeydown)
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="open" class="share-sheet-overlay" @click="close"></div>
    </Transition>
    <Transition name="sheet-slide">
      <div v-if="open" class="share-sheet" role="dialog" aria-modal="true" :aria-label="t('share')">
        <div class="share-sheet-handle" aria-hidden="true"></div>
        <div class="share-sheet-title">{{ t('share') }}</div>

        <div class="share-sheet-options">
          <a :href="telegramShareUrl" target="_blank" rel="noopener noreferrer" class="share-option" @click="onTelegramClick">
            <span class="share-option-icon telegram">
              <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M181.5 68.5l-25.5 120.2c-1.9 8.6-7 10.7-14.2 6.7l-39.2-28.9-18.9 18.2c-2.1 2.1-3.9 3.9-7.9 3.9l2.8-40.1L164 84.7c3.5-3.1-.8-4.9-5.4-1.8l-89 56.1-38.4-12c-8.3-2.6-8.5-8.3 1.8-12.3l150.2-57.9c6.9-2.6 13 1.7 10.3 12.7z"
                />
              </svg>
            </span>
            <span>Telegram</span>
          </a>

          <a :href="facebookShareUrl" target="_blank" rel="noopener noreferrer" class="share-option" @click="close">
            <span class="share-option-icon facebook">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z"
                />
              </svg>
            </span>
            <span>Facebook</span>
          </a>

          <a :href="messengerWebUrl" target="_blank" rel="noopener noreferrer" class="share-option" @click="onMessengerClick">
            <span class="share-option-icon messenger">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.54-.04.91.25 1.88.38 2.9.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46l-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75c.21.16.5.16.72 0l3.16-2.4c.42-.32.97.18.69.63z"
                />
              </svg>
            </span>
            <span>Messenger</span>
          </a>

          <button type="button" class="share-option" @click="copyLink">
            <span class="share-option-icon copy" :class="{ copied }">
              <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>{{ copied ? t('linkCopied') : t('copyLink') }}</span>
          </button>
        </div>

        <button type="button" class="share-sheet-cancel" @click="close">{{ t('cancel') }}</button>
      </div>
    </Transition>
  </Teleport>
</template>