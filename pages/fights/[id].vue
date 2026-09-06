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

const {
  data: item,
  error,
} = await useAsyncData(
  () => `fight-${id.value}`,

  () =>
    $fetch<
      FightDetail |
      FightDetail[] |
      { data: FightDetail }
    >(
      `${config.public.apiBase}/fight/${encodeURIComponent(id.value)}`
    ),

  {
    watch: [id],
  }
)

/*
|--------------------------------------------------------------------------
| Normalize API response
|--------------------------------------------------------------------------
|
| API may return:
|
| 1. FightDetail
| 2. FightDetail[]
| 3. { data: FightDetail }
|
*/
const fight = computed<FightDetail | null>(() => {
  const raw = item.value as any

  if (!raw) {
    return null
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null
  }

  return raw.data ?? raw
})

/*
|--------------------------------------------------------------------------
| Fight title
|--------------------------------------------------------------------------
*/
const fightTitle = computed(() => {
  if (!fight.value) {
    return 'V168 — Fight'
  }

  return `${fight.value.red_fighter} vs ${fight.value.blue_fighter}`
})

/*
|--------------------------------------------------------------------------
| Page URL
|--------------------------------------------------------------------------
|
| Uses the actual domain that the visitor opened.
|
| Example:
| https://v168.me/fights/123
|
| or:
|
| https://v168.shop/fights/123
|
*/
const pageUrl = computed(() => {
  return `${requestUrl.origin}${route.fullPath}`
})

/*
|--------------------------------------------------------------------------
| OG Image
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| We use ONLY thumbnail_link from the API.
|
| No og_image field.
| No separate OG image.
| No v168-og.png fallback.
|
*/
const ogImage = computed(() => {
  const thumbnail = fight.value?.thumbnail_link

  if (!thumbnail) {
    return undefined
  }

  return toAbsoluteImageUrl(
    thumbnail,
    requestUrl.origin,
    thumbnail
  )
})

/*
|--------------------------------------------------------------------------
| SEO description
|--------------------------------------------------------------------------
*/
const seoDescription = computed(() => {
  return `${fightTitle.value} — V168 cockfight result, Meron vs Wala.`
})

/*
|--------------------------------------------------------------------------
| SEO / Open Graph
|--------------------------------------------------------------------------
*/
useSeoMeta({
  /*
   * Basic SEO
   */
  title: () => `${fightTitle.value} — V168`,

  description: () => seoDescription.value,

  /*
   * Open Graph
   */
  ogTitle: () => fightTitle.value,

  ogDescription: () => seoDescription.value,

  ogType: 'website',

  ogUrl: () => pageUrl.value,

  /*
   * IMPORTANT:
   * thumbnail_link is used as og:image
   */
  ogImage: () => ogImage.value,

  /*
   * Recommended OG dimensions.
   *
   * These values describe the expected image size.
   * They DO NOT resize the actual image.
   */
  ogImageWidth: '1200',

  ogImageHeight: '630',

  ogImageAlt: () => fightTitle.value,

  /*
   * Twitter / X
   */
  twitterCard: 'summary_large_image',

  twitterTitle: () => fightTitle.value,

  twitterDescription: () => seoDescription.value,

  twitterImage: () => ogImage.value,
})
</script>

<template>
  <div>
    <!-- Header -->
    <SiteHeader />

    <main class="max-w-4xl mx-auto px-5 md:px-8 pb-28 pt-6">

      <!-- Back button -->
      <div class="back-row mb-5">
        <NuxtLink
          to="/fights"
          class="back-btn"
          aria-label="Back to fights"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </NuxtLink>

        <span class="back-title">
          {{ t('fightTitle') }}
        </span>
      </div>

      <div class="mt-4">

        <!-- Fight loaded -->
        <template v-if="fight">

          <!-- Fight card -->
          <div class="fight-card">

            <!-- Fight header -->
            <div class="fight-header">

              <span class="accent-bar"></span>

              <span class="fight-no text-xs sm:text-sm">
                No.{{ fight.no }}
              </span>

              <span class="fight-brand text-[11px] sm:text-sm">
                V168
              </span>

              <span class="fight-time text-[10px] sm:text-xs">
                {{ timeAgo(fight.created_at) }}
              </span>

            </div>

            <!-- Fighters -->
            <div class="fight-row">

              <!-- Red fighter -->
              <div class="fighter">

                <div
                  class="fighter-avatar"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${fight.red_fighter}`"
                  @click="
                    openFighterModal(
                      fight.red_image || DEFAULT_LEFT_IMAGE,
                      DEFAULT_LEFT_IMAGE,
                      fight.red_fighter,
                      'meron'
                    )
                  "
                >
                  <img
                    :src="
                      fight.red_image ||
                      DEFAULT_LEFT_IMAGE
                    "
                    :alt="fight.red_fighter"
                    loading="lazy"
                  >
                </div>

                <div class="fighter-name text-xs sm:text-sm">
                  {{ fight.red_fighter }}
                </div>

              </div>

              <!-- Red score -->
              <div class="score-col">

                <span
                  class="score-label meron text-[11px] sm:text-[13px]"
                >
                  {{ t('meron') }}
                </span>

                <span
                  class="score-value meron text-sm sm:text-lg"
                >
                  {{ fight.red_score }}
                </span>

              </div>

              <!-- VS -->
              <div class="vs-badge">

                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                >
                  <defs>
                    <linearGradient
                      id="vsGradDetail"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stop-color="#ffb347"
                      />

                      <stop
                        offset="100%"
                        stop-color="#ff4141"
                      />
                    </linearGradient>
                  </defs>

                  <text
                    x="12"
                    y="17"
                    text-anchor="middle"
                    font-family="Rajdhani, sans-serif"
                    font-weight="700"
                    font-size="14"
                    fill="url(#vsGradDetail)"
                  >
                    VS
                  </text>
                </svg>

              </div>

              <!-- Blue score -->
              <div class="score-col">

                <span
                  class="score-label wala text-[11px] sm:text-[13px]"
                >
                  {{ t('wala') }}
                </span>

                <span
                  class="score-value wala text-sm sm:text-lg"
                >
                  {{ fight.blue_score }}
                </span>

              </div>

              <!-- Blue fighter -->
              <div class="fighter">

                <div
                  class="fighter-avatar"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${fight.blue_fighter}`"
                  @click="
                    openFighterModal(
                      fight.blue_image || DEFAULT_RIGHT_IMAGE,
                      DEFAULT_RIGHT_IMAGE,
                      fight.blue_fighter,
                      'wala'
                    )
                  "
                >
                  <img
                    :src="
                      fight.blue_image ||
                      DEFAULT_RIGHT_IMAGE
                    "
                    :alt="fight.blue_fighter"
                    loading="lazy"
                  />
                </div>

                <div class="fighter-name text-xs sm:text-sm">
                  {{ fight.blue_fighter }}
                </div>

              </div>

            </div>
          </div>

          <!-- Share buttons -->
          <ShareButtons
            :url="pageUrl"
            :title="fightTitle"
          />

        </template>

        <!-- Error -->
        <div
          v-else-if="error"
          class="state-msg"
        >
          This fight could not be loaded.
        </div>

        <!-- Loading -->
        <div
          v-else
          class="state-msg"
        >
          {{ t('loadingVideo') }}
        </div>

      </div>
    </main>

    <!-- Fighter modal -->
    <FighterModal />

    <!-- Footer -->
    <FooterNav />

  </div>
</template>