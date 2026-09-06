<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const requestUrl = useRequestURL()
const { t } = useLang()

const DEFAULT_LEFT_IMAGE = '/images/left.png'
const DEFAULT_RIGHT_IMAGE = '/images/right.png'
const { openFighterModal } = useFighterModal()

const id = computed(() => route.params.id as string)

interface FightDetail {
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

const { data: item, error } = await useAsyncData(
  () => `fight-${id.value}`,
  () => $fetch<FightDetail | FightDetail[] | { data: FightDetail }>(`${config.public.apiBase}/fight/${encodeURIComponent(id.value)}`),
  { watch: [id] }
)

// Mirrors the video detail endpoint: API may return a single object, an
// array containing one object, or { data: {...} }.
const fight = computed<FightDetail | null>(() => {
  const raw = item.value as any
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw.data ?? raw
})

const fightTitle = computed(() =>
  fight.value ? `${fight.value.red_fighter} vs ${fight.value.blue_fighter}` : 'V168 — Fight'
)

// Always derived from the actual incoming request host, not a fixed
// config value — production serves both v168.me and v168.shop live, so
// this has to resolve to whichever domain the visitor (and Facebook's
// crawler) actually hit, or og:url/the share link won't match the page.
const pageUrl = computed(() => `${requestUrl.origin}${route.fullPath}`)

useSeoMeta({
  title: () => `${fightTitle.value} — V168`,
  description: () => `${fightTitle.value} — V168 cockfight result, Meron vs Wala.`,
  ogTitle: () => fightTitle.value,
  ogDescription: () => `${fightTitle.value} — V168 cockfight result, Meron vs Wala.`,
  ogImage: () => toAbsoluteImageUrl(fight.value?.thumbnail_link, requestUrl.origin, `${requestUrl.origin}/v168.png`),
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <SiteHeader />

    <main class="max-w-4xl mx-auto px-5 md:px-8 pb-28 pt-6">
      <div class="back-row mb-5">
        <NuxtLink to="/fights" class="back-btn" aria-label="Back to fights">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </NuxtLink>
        <span class="back-title">{{ t('fightTitle') }}</span>
      </div>

      <div class="mt-4">
        <template v-if="fight">
          <div class="fight-card">
            <div class="fight-header">
              <span class="accent-bar"></span>
              <span class="fight-no text-xs sm:text-sm">No.{{ fight.no }}</span>
              <span class="fight-brand text-[11px] sm:text-sm">V168</span>
              <span class="fight-time text-[10px] sm:text-xs">{{ timeAgo(fight.created_at) }}</span>
            </div>
            <div class="fight-row">
              <div class="fighter">
                <div
                  class="fighter-avatar"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${fight.red_fighter}`"
                  @click="openFighterModal(fight.red_image || DEFAULT_LEFT_IMAGE, DEFAULT_LEFT_IMAGE, fight.red_fighter, 'meron')"
                >
                  <img :src="fight.red_image || DEFAULT_LEFT_IMAGE" :alt="fight.red_fighter" loading="lazy">
                </div>
                <div class="fighter-name text-xs sm:text-sm">{{ fight.red_fighter }}</div>
              </div>
              <div class="score-col">
                <span class="score-label meron text-[11px] sm:text-[13px]">{{ t('meron') }}</span>
                <span class="score-value meron text-sm sm:text-lg">{{ fight.red_score }}</span>
              </div>
              <div class="vs-badge">
                <svg width="34" height="34" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="vsGradDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#ffb347" />
                      <stop offset="100%" stop-color="#ff4141" />
                    </linearGradient>
                  </defs>
                  <text x="12" y="17" text-anchor="middle" font-family="Rajdhani, sans-serif" font-weight="700" font-size="14" fill="url(#vsGradDetail)">VS</text>
                </svg>
              </div>
              <div class="score-col">
                <span class="score-label wala text-[11px] sm:text-[13px]">{{ t('wala') }}</span>
                <span class="score-value wala text-sm sm:text-lg">{{ fight.blue_score }}</span>
              </div>
              <div class="fighter">
                <div
                  class="fighter-avatar"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${fight.blue_fighter}`"
                  @click="openFighterModal(fight.blue_image || DEFAULT_RIGHT_IMAGE, DEFAULT_RIGHT_IMAGE, fight.blue_fighter, 'wala')"
                >
                  <img :src="fight.blue_image || DEFAULT_RIGHT_IMAGE" :alt="fight.blue_fighter" loading="lazy">
                </div>
                <div class="fighter-name text-xs sm:text-sm">{{ fight.blue_fighter }}</div>
              </div>
            </div>
          </div>

          <ShareButtons :url="pageUrl" :title="fightTitle" />
        </template>

        <div v-else-if="error" class="state-msg">{{ 'This fight could not be loaded.' }}</div>
        <div v-else class="state-msg">{{ t('loadingVideo') }}</div>
      </div>
    </main>

    <FighterModal />

    <FooterNav />
  </div>
</template>
