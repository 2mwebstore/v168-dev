<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const origin = useSiteOrigin()
const { t } = useLang()

const id = computed(() => route.params.id as string)

interface VideoDetail {
  id: number | string
  title: string
  photo?: string
  video?: string
  view?: number
  created_at?: string
  date?: string
  detail?: string
}

const { data: item, error } = await useAsyncData(
  () => `video-${id.value}`,
  // retry once: if the API hiccups while Facebook/Telegram's crawler is
  // scraping this page, the SSR HTML would otherwise ship with no OG image.
  () => $fetch<VideoDetail | VideoDetail[] | { data: VideoDetail }>(
    `${config.public.apiBase}/channel/${encodeURIComponent(id.value)}`,
    { retry: 1, retryDelay: 400 }
  ),
  { watch: [id] }
)

// API returns either a single object, an array containing one object, or { data: {...} }.
const video = computed<VideoDetail | null>(() => {
  const raw = item.value as any
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw.data ?? raw
})

// Always derived from the actual incoming request host, not a fixed
// config value — production serves both v168.me and v168.shop live, so
// this has to resolve to whichever domain the visitor (and Facebook's
// crawler) actually hit, or og:url/the share link won't match the page.
const pageUrl = computed(() => `${origin}${route.fullPath}`)

const ogImage = computed(() => toAbsoluteImageUrl(video.value?.photo, origin, `${origin}/v168.png`))
const ogDescription = computed(() => video.value?.detail || 'Watch this V168 fight video.')

useSeoMeta({
  title: () => (video.value ? `${video.value.title} — V168` : 'V168 — Video'),
  description: () => ogDescription.value,
  ogTitle: () => video.value?.title || 'V168 — Video',
  ogDescription: () => ogDescription.value,
  // 'website' rather than 'video.other': Facebook expects og:video:* tags
  // alongside a video.* type and can drop the image preview when they're
  // missing. We only have a poster image to offer, so describe it as a page.
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  ogImage: () => ogImage.value,
  // secure_url + width/height are what let Facebook render the picture on
  // the *first* share instead of the blank "no image yet" card — without
  // the dimensions it fetches the image asynchronously and the first
  // scrape ships without it.
  ogImageSecureUrl: () => (ogImage.value.startsWith('https://') ? ogImage.value : undefined),
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: () => video.value?.title || 'V168',
  twitterCard: 'summary_large_image',
  twitterTitle: () => video.value?.title || 'V168 — Video',
  twitterDescription: () => ogDescription.value,
  twitterImage: () => ogImage.value,
})
</script>

<template>
  <div>
    <SiteHeader />

    <main class="max-w-4xl mx-auto px-5 md:px-8 pb-28 pt-6">
      <div class="back-row mb-5">
        <NuxtLink to="/videos" class="back-btn" aria-label="Back to videos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </NuxtLink>
        <span class="back-title">{{ t('videosTitle') }}</span>
      </div>

      <div class="mt-4">
        <template v-if="video">
          <div id="playerWrap" class="card">
            <video :src="video.video || ''" controls autoplay playsinline :poster="video.photo || ''"></video>
          </div>
          <h1 class="detail-title mt-4">{{ video.title }}</h1>
          <div class="detail-meta">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              {{ video.view ?? 0 }} <span>{{ t('views') }}</span>
            </span>
            <span class="meta-dot"></span>
            <span>{{ timeAgo(video.created_at || video.date) }}</span>
          </div>
          <div v-if="video.detail" class="detail-desc">{{ video.detail }}</div>

          <ShareButtons :url="pageUrl" :title="video.title" />
        </template>

        <div v-else-if="error" class="state-msg">{{ 'This video could not be loaded.' }}</div>
        <div v-else class="state-msg">{{ t('loadingVideo') }}</div>
      </div>
    </main>

    <FooterNav />
  </div>
</template>