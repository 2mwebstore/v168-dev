<script setup lang="ts">
const { open, url, title, closeShareSheet } = useShareSheet()
const { t } = useLang()

const copied = ref(false)

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
  const deepLink = `tg://msg_url?${params.toString()}`
  const webUrl = telegramShareUrl.value

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
  close()
}

const facebookShareUrl = computed(() => {
  const params = new URLSearchParams({ u: url.value })
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`
})

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