<script setup lang="ts">
const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const { t } = useLang()

useSeoMeta({
  title: 'បញ្ជីប្រគួត — V168 | List Fight',
  description: 'Browse today\'s V168 cockfight results — Meron vs Wala scores for every match.',
  ogTitle: 'V168 — List Fight',
  ogDescription: 'Browse today\'s V168 cockfight results — Meron vs Wala scores for every match.',
  ogType: 'website',
})

const FIGHTS_API_URL = `${config.public.apiBase}/fight`
const DEFAULT_LEFT_IMAGE = '/images/left.png'
const DEFAULT_RIGHT_IMAGE = '/images/right.png'

interface FightItem {
  id: number | string
  no: string
  red_fighter: string
  red_image?: string
  red_score: string | number
  blue_fighter: string
  blue_image?: string
  blue_score: string | number
  thumbnail_link?: string
  created_at?: string
}

const todayOnly = ref(true)
const items = ref<FightItem[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const done = ref(false)
const errored = ref(false)

const { data: firstPage } = await useAsyncData('fights-page-1', () =>
  $fetch<{ data: FightItem[]; last_page?: number }>(FIGHTS_API_URL, { params: { page: 1 } }).catch(() => null)
)

if (firstPage.value) {
  const all = firstPage.value.data || []
  items.value = todayOnly.value ? all.filter((f) => isTodayInPhnomPenh(f.created_at)) : all
  lastPage.value = firstPage.value.last_page || 1
  page.value = 1
}

async function loadPage(p: number): Promise<void> {
  try {
    const json = await $fetch<{ data: FightItem[]; last_page?: number }>(FIGHTS_API_URL, { params: { page: p } })
    const pageItems = json.data || []
    const visible = todayOnly.value ? pageItems.filter((f) => isTodayInPhnomPenh(f.created_at)) : pageItems
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
    console.error('Fights API error:', err)
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
  if (done.value) return items.value.length ? t('noMoreFights') : (todayOnly.value ? t('noFightsToday') : t('noMoreFights'))
  return ''
})

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => { if (entry.isIntersecting) fetchMore() }),
    { root: null, rootMargin: '600px 0px', threshold: 0 }
  )
  if (sentinel.value) observer.observe(sentinel.value)
  setTimeout(fetchMore, 300)
})
onUnmounted(() => observer?.disconnect())

// ---- fighter photo modal (shared with the Live page's active-fight card) ----
const { openFighterModal } = useFighterModal()
</script>

<template>
  <div>
    <SiteHeader />

    <main class="max-w-5xl mx-auto px-5 md:px-8 pb-28">
      <section class="pt-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h1 class="page-title text-xl sm:text-2xl">{{ t('fightTitle') }}</h1>
          <TodayFilterButton v-model="todayOnly" />
        </div>

        <div class="fight-list">
          <NuxtLink v-for="f in items" :key="f.id" :to="`/fights/${f.id}`" class="fight-card">
            <div class="fight-header">
              <span class="accent-bar"></span>
              <span class="fight-no text-xs sm:text-sm">No.{{ f.no }}</span>
              <span class="fight-brand text-[11px] sm:text-sm">V168</span>
              <span class="fight-time text-[10px] sm:text-xs">{{ timeAgo(f.created_at) }}</span>
            </div>
            <div class="fight-row">
              <div class="fighter">
                <div
                  class="fighter-avatar"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${f.red_fighter}`"
                  @click.stop="openFighterModal(f.red_image || DEFAULT_LEFT_IMAGE, DEFAULT_LEFT_IMAGE, f.red_fighter, 'meron')"
                >
                  <img :src="f.red_image || DEFAULT_LEFT_IMAGE" :alt="f.red_fighter" loading="lazy">
                </div>
                <div class="fighter-name text-xs sm:text-sm">{{ f.red_fighter }}</div>
              </div>
              <div class="score-col">
                <span class="score-label meron text-[11px] sm:text-[13px]">{{ t('meron') }}</span>
                <span class="score-value meron text-sm sm:text-lg">{{ f.red_score }}</span>
              </div>
              <div class="vs-badge">
                <svg width="34" height="34" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient :id="`vsGrad${f.id}`" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#ffb347" />
                      <stop offset="100%" stop-color="#ff4141" />
                    </linearGradient>
                  </defs>
                  <text x="12" y="17" text-anchor="middle" font-family="Rajdhani, sans-serif" font-weight="700" font-size="14" :fill="`url(#vsGrad${f.id})`">VS</text>
                </svg>
              </div>
              <div class="score-col">
                <span class="score-label wala text-[11px] sm:text-[13px]">{{ t('wala') }}</span>
                <span class="score-value wala text-sm sm:text-lg">{{ f.blue_score }}</span>
              </div>
              <div class="fighter">
                <div
                  class="fighter-avatar"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${f.blue_fighter}`"
                  @click.stop="openFighterModal(f.blue_image || DEFAULT_RIGHT_IMAGE, DEFAULT_RIGHT_IMAGE, f.blue_fighter, 'wala')"
                >
                  <img :src="f.blue_image || DEFAULT_RIGHT_IMAGE" :alt="f.blue_fighter" loading="lazy">
                </div>
                <div class="fighter-name text-xs sm:text-sm">{{ f.blue_fighter }}</div>
              </div>
            </div>

            <ShareIconButton :url="`${requestUrl.origin}/fights/${f.id}`" :title="`${f.red_fighter} vs ${f.blue_fighter}`" />
          </NuxtLink>
        </div>

        <div ref="sentinel"></div>
        <div v-if="statusText" class="scroll-status">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ statusText }}</span>
        </div>
      </section>
    </main>

    <FighterModal />

    <FooterNav />
  </div>
</template>
