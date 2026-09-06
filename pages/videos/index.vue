<script setup lang="ts">
const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const { t } = useLang()

useSeoMeta({
  title: 'វីដេអូ — V168 | Videos',
  description: 'Browse the latest V168 fight videos and highlights.',
  ogTitle: 'V168 — Videos',
  ogDescription: 'Browse the latest V168 fight videos and highlights.',
  ogType: 'website',
})

const VIDEOS_API_URL = `${config.public.apiBase}/channel`

interface VideoItem {
  id: number | string
  title: string
  photo?: string
  view?: number
  created_at?: string
  date?: string
}

const todayOnly = ref(true)
const items = ref<VideoItem[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const done = ref(false)
const errored = ref(false)

// SSR-rendered first page so crawlers see real video listings, not an
// empty shell that only fills in client-side.
const { data: firstPage } = await useAsyncData('videos-page-1', () =>
  $fetch<{ data: VideoItem[]; last_page?: number }>(VIDEOS_API_URL, { params: { page: 1 } }).catch(() => null)
)

if (firstPage.value) {
  const all = firstPage.value.data || []
  items.value = todayOnly.value ? all.filter((v) => isTodayInPhnomPenh(v.created_at || v.date)) : all
  lastPage.value = firstPage.value.last_page || 1
  page.value = 1
}

async function loadPage(p: number): Promise<void> {
  try {
    const json = await $fetch<{ data: VideoItem[]; last_page?: number }>(VIDEOS_API_URL, { params: { page: p } })
    const pageItems = json.data || []
    const visible = todayOnly.value ? pageItems.filter((v) => isTodayInPhnomPenh(v.created_at || v.date)) : pageItems
    items.value.push(...visible)
    lastPage.value = json.last_page || p
    page.value = p

    if (page.value >= lastPage.value) {
      done.value = true
      loading.value = false
      return
    }

    if (todayOnly.value && visible.length === 0) {
      return loadPage(page.value + 1)
    }

    loading.value = false
  } catch (err) {
    console.error('Videos API error:', err)
    errored.value = true
    loading.value = false
  }
}

function fetchMore() {
  if (loading.value || done.value) return
  loading.value = true
  errored.value = false
  loadPage(page.value + 1)
}

function toggleToday() {
  items.value = []
  page.value = 1
  lastPage.value = 1
  done.value = false
  loading.value = false
  errored.value = false
  loading.value = true
  loadPage(1)
}

watch(todayOnly, () => toggleToday())

const statusText = computed(() => {
  if (errored.value) return t('loadFailed')
  if (loading.value) return t('loadingMore')
  if (done.value) return items.value.length ? t('noMoreVideos') : (todayOnly.value ? t('noVideosToday') : t('noMoreVideos'))
  return ''
})

// Infinite scroll
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => { if (entry.isIntersecting) fetchMore() }),
    { root: null, rootMargin: '600px 0px', threshold: 0 }
  )
  if (sentinel.value) observer.observe(sentinel.value)

  // Covers the case where page 1's items don't fill the screen.
  setTimeout(fetchMore, 300)
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div>
    <SiteHeader />

    <main class="max-w-7xl mx-auto px-5 md:px-8 pb-28">
      <section class="pt-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h1 class="page-title">{{ t('videosTitle') }}</h1>
          <TodayFilterButton v-model="todayOnly" />
        </div>

        <div class="video-list">
          <template v-for="(v, i) in items" :key="v.id">
            <div v-if="i > 0" class="video-list-divider"></div>
            <NuxtLink :to="`/videos/${v.id}`" class="video-card">
              <div class="video-thumb">
                <img :src="v.photo || ''" :alt="v.title" loading="lazy">
                <div class="play-badge">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.45)" /><path d="M10 8l6 4-6 4V8z" fill="#fff" /></svg>
                </div>
              </div>
              <div class="video-info">
                <div class="video-title">{{ v.title }}</div>
                <div class="video-meta">
                  <span class="video-views">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    {{ v.view ?? 0 }} <span>{{ t('views') }}</span>
                  </span>
                  <span class="meta-dot"></span>
                  <span class="video-time">{{ timeAgo(v.created_at || v.date) }}</span>
                </div>
                <ShareIconButton :url="`${requestUrl.origin}/videos/${v.id}`" :title="v.title" />
              </div>
            </NuxtLink>
          </template>
        </div>

        <div ref="sentinel"></div>
        <div v-if="statusText" class="scroll-status">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ statusText }}</span>
        </div>
      </section>
    </main>

    <FooterNav />
  </div>
</template>
