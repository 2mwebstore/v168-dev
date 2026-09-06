<script setup lang="ts">
const requestUrl = useRequestURL()
const { t } = useLang()

const DEFAULT_LEFT_IMAGE = '/images/left.png'
const DEFAULT_RIGHT_IMAGE = '/images/right.png'
const { openFighterModal } = useFighterModal()

useSeoMeta({
  title: 'V168 — ផ្សាយផ្ទាល់ | Live Sabong Streaming',
  description:
    'Watch V168 live cockfight streaming, vote Meron vs Wala, and follow the current active fight in real time.',
  ogTitle: 'V168 — Live',
  ogDescription:
    'Watch V168 live cockfight streaming, vote Meron vs Wala, and follow the current active fight in real time.',
  ogImage: `${requestUrl.origin}/v168.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// --------------------------------------------------
// CHANNELS
// --------------------------------------------------

interface Channel {
  id: number
  title: string
  streamName: string
  channelName: string
  dataId: string
  thumb: string
  message: string
  votes_red: number
  votes_blue: number
  red_percent_vote: number
  blue_percent_vote: number
}

const channels = reactive<Channel[]>([
  {
    id: 1,
    title: 'V168',
    streamName: 'gv168',
    channelName: 'V168',
    dataId: '47',
    thumb: '/images/background.jpg',
    message: '',
    votes_red: 0,
    votes_blue: 0,
    red_percent_vote: 50,
    blue_percent_vote: 50,
  },
])

// --------------------------------------------------
// LIVE STREAM
// --------------------------------------------------

const {
  playViaSocket,
  cleanup: cleanupLiveSocket,
} = useLiveSocket()

const currentChannelId = ref<number | null>(null)

const thumbnailSrc = ref('')
const thumbnailOpacity = ref('1')

const liveIframeSrc = ref('')

const comingSoonText = ref('')
const comingSoonOpacity = ref('0')

const thumbnailZ = ref('12')
const iframeZ = ref('1')

// --------------------------------------------------
// VOTE DATA
// --------------------------------------------------

const redPercent = ref('50.0')
const bluePercent = ref('50.0')

const totalVotes = ref(0)
const redScore = ref(0)
const blueScore = ref(0)

function updateStats(video: Channel) {
  const votesRed = video.votes_red ?? 0
  const votesBlue = video.votes_blue ?? 0

  const total = votesRed + votesBlue

  let rp = video.red_percent_vote ?? 50
  let bp = video.blue_percent_vote ?? 50

  if (total > 0) {
    rp = Number(
      ((votesRed / total) * 100).toFixed(1),
    )

    bp = Number(
      ((votesBlue / total) * 100).toFixed(1),
    )
  }

  redPercent.value = `${rp}`
  bluePercent.value = `${bp}`

  totalVotes.value = total

  redScore.value = votesRed
  blueScore.value = votesBlue
}

function setLoadingZIndex() {
  thumbnailZ.value = '12'
  iframeZ.value = '1'
}

function setReadyZIndex() {
  thumbnailZ.value = '1'
  iframeZ.value = '12'
}

// --------------------------------------------------
// STREAM PROTECTION
// --------------------------------------------------

// Each play request receives an ID.
// Old socket callbacks cannot update the new stream.
let playRequestId = 0

// Protect onMounted from starting stream twice.
let hasStartedOnce = false

async function playStream(video: Channel) {
  /*
   * IMPORTANT:
   *
   * If user clicks the currently playing channel,
   * don't reconnect and don't reload iframe.
   */
  if (
    currentChannelId.value === video.id &&
    liveIframeSrc.value
  ) {
    return
  }

  const requestId = ++playRequestId

  /*
   * Protect against the socket sending the
   * success callback more than once.
   */
  let streamResolved = false

  currentChannelId.value = video.id

  updateStats(video)

  thumbnailSrc.value = video.thumb || ''
  thumbnailOpacity.value = '1'

  comingSoonOpacity.value = '1'
  comingSoonText.value =
    video.message || t('loading')

  /*
   * IMPORTANT:
   *
   * Do NOT do:
   *
   * liveIframeSrc.value = ''
   *
   * Clearing the iframe causes:
   *
   * video URL
   * -> about:blank
   * -> video URL
   *
   * which looks like the video loads twice.
   */

  setLoadingZIndex()

  await playViaSocket(
    {
      channelId: String(
        video.dataId ?? video.id,
      ),

      streamName:
        video.streamName || video.title,
    },

    async (url) => {
      /*
       * Ignore callback from an older
       * playStream() request.
       */
      if (requestId !== playRequestId) {
        return
      }

      /*
       * Socket sometimes may send the same
       * success event multiple times.
       */
      if (streamResolved) {
        // console.log(
        //   '[LIVE] Duplicate socket callback ignored:',
        //   url,
        // )

        return
      }

      streamResolved = true

      /*
       * Don't assign src again when the
       * iframe already has exactly the same URL.
       */
      if (liveIframeSrc.value !== url) {
        // console.log(
        //   '[LIVE] Loading iframe:',
        //   url,
        // )

        liveIframeSrc.value = url
      } 
      // else {
      //   console.log(
      //     '[LIVE] Same iframe URL ignored:',
      //     url,
      //   )
      // }

      thumbnailOpacity.value = '0'
      comingSoonOpacity.value = '0'

      setReadyZIndex()
    },

    (errorKey) => {
      /*
       * Ignore error from old socket request.
       */
      if (requestId !== playRequestId) {
        return
      }

      comingSoonText.value = t(errorKey)

      setLoadingZIndex()
    },
  )
}

// --------------------------------------------------
// VOTING
// --------------------------------------------------

const heartHost =
  ref<HTMLElement | null>(null)

function createHeart(el: HTMLElement) {
  const rect =
    el.getBoundingClientRect()

  const heart =
    document.createElement('span')

  heart.className = 'heart-float'
  heart.textContent = '♥'

  heart.style.top =
    `${rect.top - 10}px`

  heart.style.left =
    `${
      rect.left +
      rect.width / 2 -
      8
    }px`

  document.body.appendChild(heart)

  setTimeout(() => {
    heart.remove()
  }, 1000)
}

function sendVote(
  type: 'red' | 'blue',
  event: MouseEvent,
) {
  const channelId =
    currentChannelId.value

  if (!channelId) return

  const video = channels.find(
    (v) => v.id === channelId,
  )

  if (!video) return

  if (type === 'red') {
    video.votes_red =
      (video.votes_red || 0) + 1
  }

  if (type === 'blue') {
    video.votes_blue =
      (video.votes_blue || 0) + 1
  }

  updateStats(video)

  createHeart(
    event.currentTarget as HTMLElement,
  )
}

// --------------------------------------------------
// INITIAL STREAM
// --------------------------------------------------

onMounted(() => {
  /*
   * Protect against duplicate mount/HMR.
   */
  if (hasStartedOnce) {
    return
  }

  hasStartedOnce = true

  if (channels.length > 0) {
    playStream(channels[0])
  }
})

// --------------------------------------------------
// CLEANUP SOCKET
// --------------------------------------------------

onUnmounted(() => {
  /*
   * Invalidate every previous callback.
   */
  playRequestId++

  cleanupLiveSocket()
})

// --------------------------------------------------
// CURRENT ACTIVE FIGHT
// --------------------------------------------------

interface ActiveFight {
  id: number
  no: string

  red_fighter: string
  red_image: string
  red_score: string | number

  blue_fighter: string
  blue_image: string
  blue_score: string | number

  updated_at: string
}

const activeFight =
  ref<ActiveFight | null>(null)

let activeFightPoll:
  ReturnType<typeof setInterval> | null =
  null

async function fetchActiveFight() {
  try {
    const res =
      await fetch('/api/fightactive')

    if (!res.ok) {
      return
    }

    const fight = await res.json()

    if (!fight || !fight.id) {
      activeFight.value = null
      return
    }

    /*
     * Only update Vue state when fight data
     * actually changed.
     */
    if (
      !activeFight.value ||
      fight.id !==
        activeFight.value.id ||
      fight.updated_at !==
        activeFight.value.updated_at
    ) {
      activeFight.value = fight
    }
  } catch (err) {
    console.error(
      'Active fight API error:',
      err,
    )
  }
}

onMounted(() => {
  fetchActiveFight()

  activeFightPoll = setInterval(
    fetchActiveFight,
    10000,
  )
})

onUnmounted(() => {
  if (activeFightPoll) {
    clearInterval(activeFightPoll)

    activeFightPoll = null
  }
})
</script>

<template>
  <div>
    <SiteHeader />

    <main
      class="max-w-7xl mx-auto px-5 md:px-8 pb-10"
    >
      <section
        id="live"
        class="pt-4 md:pt-4"
      >
        <!-- CHANNEL LIST -->
        <div
          id="channelList"
          class="channel-list flex items-center gap-1 overflow-x-auto px-3 py-2 mb-4"
        >
          <button
            v-for="v in channels"
            :key="v.id"
            type="button"
            class="chip channel-btn font-display text-xs rounded-full tracking-wide shrink-0 backdrop-blur bg-[#161d3191]"
            :class="{
              active:
                currentChannelId === v.id,
            }"
            @click="playStream(v)"
          >
            <span
              class="avatar backdrop-blur bg-[#161d3191]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect
                  x="3"
                  y="6"
                  width="18"
                  height="13"
                  rx="2"
                />

                <path
                  d="M8 3l4 3 4-3"
                />
              </svg>
            </span>

            <span>
              {{ v.title }}
            </span>
          </button>
        </div>

        <!-- VIDEO PLAYER -->
        <div
          class="rounded-t-lg overflow-hidden card noise-grad"
        >
          <div id="player-container">
            <div class="aspect-wrap">
              <!-- THUMBNAIL -->
              <img
                id="thumbnail"
                :src="thumbnailSrc"
                :style="{
                  opacity:
                    thumbnailOpacity,
                  zIndex:
                    thumbnailZ,
                }"
                alt="Channel thumbnail"
              >

              <!--
                IMPORTANT:

                This iframe stays mounted.

                We no longer clear src before
                assigning the stream URL.
              -->
              <iframe
                id="liveIframe"
                :src="liveIframeSrc"
                :style="{
                  zIndex: iframeZ,
                }"
                width="100%"
                height="100%"
                frameborder="0"
                scrolling="no"
                allow="autoplay; fullscreen"
                allowfullscreen
              />

              <!-- LOADING -->
              <div
                id="comingSoon"
                class="coming-soon"
                :style="{
                  opacity:
                    comingSoonOpacity,
                }"
              >
                {{ comingSoonText }}
              </div>

              <!-- LIVE BADGE -->
              <div
                class="hlb-live-badge"
              >
                <span
                  class="dot"
                  aria-hidden="true"
                />

                <span
                  class="font-display text-xs tracking-widest"
                  style="font-weight: 700"
                >
                  {{ t('live') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- VOTE BAR -->
        <div class="vote-container">
          <!-- RED -->
          <div
            id="voteRed"
            class="side meron-side"
            role="button"
            tabindex="0"
            aria-label="Vote MERON"
            @click="
              sendVote(
                'red',
                $event,
              )
            "
          >
            <div class="heart">
              ♥
            </div>

            <div class="score">
              {{ redScore }}
            </div>
          </div>

          <!-- BAR -->
          <div class="bar">
            <div
              class="bar-meron"
              :style="{
                width:
                  `${redPercent}%`,
              }"
            />

            <div
              class="bar-wala"
              :style="{
                width:
                  `${bluePercent}%`,
              }"
            />
          </div>

          <!-- BLUE -->
          <div
            id="voteBlue"
            class="side wala-side"
            role="button"
            tabindex="0"
            aria-label="Vote WALA"
            @click="
              sendVote(
                'blue',
                $event,
              )
            "
          >
            <div class="heart">
              ♥
            </div>

            <div class="score">
              {{ blueScore }}
            </div>
          </div>
        </div>

        <!-- VOTE STATS -->
        <div class="stats">
          <span
            class="meron-text text-xs sm:text-sm md:text-xl"
          >
            <span>
              {{ t('meron') }}
            </span>:

            <strong>
              {{ redPercent }}%
            </strong>
          </span>

          <span
            class="text-xs sm:text-sm md:text-xl"
          >
            <span>
              {{ t('totalVotes') }}
            </span>:

            <strong>
              {{ totalVotes }}
            </strong>
          </span>

          <span
            class="wala-text text-xs sm:text-sm md:text-xl"
          >
            <span>
              {{ t('wala') }}
            </span>:

            <strong>
              {{ bluePercent }}%
            </strong>
          </span>
        </div>
      </section>

      <!-- CURRENT ACTIVE FIGHT -->
      <section
        v-if="activeFight"
        class="pt-1"
      >
        <div class="active-fight-card">
          <div
            class="active-fight-header"
          >
            <span
              class="active-fight-accent"
            />

            <span
              class="active-fight-no"
            >
              No.{{ activeFight.no }}
            </span>

            <span
              class="active-fight-badge"
            >
              {{ t('fight') }}
            </span>
          </div>

          <div
            class="active-fight-row"
          >
            <!-- RED FIGHTER -->
            <div
              class="active-fighter"
            >
              <div
                class="active-fighter-avatar w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24"
                role="button"
                tabindex="0"
                :aria-label="
                  `View ${activeFight.red_fighter}`
                "
                @click="
                  openFighterModal(
                    activeFight.red_image ||
                      DEFAULT_LEFT_IMAGE,
                    DEFAULT_LEFT_IMAGE,
                    activeFight.red_fighter,
                    'meron',
                  )
                "
              >
                <img
                  :src="
                    activeFight.red_image ||
                    DEFAULT_LEFT_IMAGE
                  "
                  :alt="
                    activeFight.red_fighter
                  "
                >
              </div>

              <div
                class="active-fighter-name"
              >
                {{
                  activeFight.red_fighter
                }}
              </div>

              <div
                class="active-fighter-score meron"
              >
                {{
                  activeFight.red_score
                }}
              </div>
            </div>

            <!-- VS -->
            <div
              class="active-vs"
            >
              VS
            </div>

            <!-- BLUE FIGHTER -->
            <div
              class="active-fighter"
            >
              <div
                class="active-fighter-avatar w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24"
                role="button"
                tabindex="0"
                :aria-label="
                  `View ${activeFight.blue_fighter}`
                "
                @click="
                  openFighterModal(
                    activeFight.blue_image ||
                      DEFAULT_RIGHT_IMAGE,
                    DEFAULT_RIGHT_IMAGE,
                    activeFight.blue_fighter,
                    'wala',
                  )
                "
              >
                <img
                  :src="
                    activeFight.blue_image ||
                    DEFAULT_RIGHT_IMAGE
                  "
                  :alt="
                    activeFight.blue_fighter
                  "
                >
              </div>

              <div
                class="active-fighter-name"
              >
                {{
                  activeFight.blue_fighter
                }}
              </div>

              <div
                class="active-fighter-score wala"
              >
                {{
                  activeFight.blue_score
                }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <FighterModal />

    <FooterNav />
  </div>
</template>