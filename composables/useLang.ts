export type Lang = 'km' | 'en'

const translations: Record<string, Record<Lang, string>> = {
  live: { en: 'LIVE', km: 'ផ្សាយផ្ទាល់' },
  videos: { en: 'VIDEOS', km: 'វីដេអូ' },
  videosTitle: { en: 'Videos', km: 'វីដេអូ' },
  fight: { en: 'LIST FIGHT', km: 'បញ្ជីប្រគួត' },
  fightTitle: { en: 'List Fight', km: 'បញ្ជីប្រគួត' },
  views: { en: 'views', km: 'ចំនួនមើល' },
  loading: { en: 'Loading…', km: 'កំពុងផ្ទុក…' },
  loadingMore: { en: 'Loading more…', km: 'កំពុងផ្ទុកបន្ថែម…' },
  loadingChannels: { en: 'Loading channels…', km: 'កំពុងផ្ទុកបណ្តាញ…' },
  loadingVideo: { en: 'Loading video…', km: 'កំពុងផ្ទុកវីដេអូ…' },
  totalVotes: { en: 'TOTAL VOTES', km: 'សរុបការបោះឆ្នោត' },
  meron: { en: 'MERON', km: 'ក្រហម' },
  wala: { en: 'WALA', km: 'ខៀវ' },
  today: { en: 'Today', km: 'ថ្ងៃនេះ' },
  noMoreFights: { en: 'No more fights', km: 'គ្មានការប្រកួតទៀតទេ' },
  noFightsToday: { en: 'No fights today', km: 'មិនមានការប្រកួតថ្ងៃនេះទេ' },
  noMoreVideos: { en: 'No more videos', km: 'គ្មានវីដេអូទៀតទេ' },
  noVideosToday: { en: 'No videos today', km: 'មិនមានវីដេអូថ្ងៃនេះទេ' },
  loadFailed: { en: 'Failed to load — retrying on scroll', km: 'ផ្ទុកមិនបានសម្រេច — សូមទាញអេក្រង់ម្ដងទៀត' },
  streamUnavailable: { en: 'Stream unavailable.', km: 'ការផ្សាយផ្ទាល់មិនអាចប្រើបានទេ។' },
  share: { en: 'Share', km: 'ចែករំលែក' },
  copyLink: { en: 'Copy link', km: 'ចម្លងតំណ' },
  linkCopied: { en: 'Link copied!', km: 'បានចម្លងតំណ!' },
  cancel: { en: 'Cancel', km: 'បោះបង់' },
}

const flags: Record<Lang, string> = { km: '🇰🇭', en: '🇬🇧' }
const order: Lang[] = ['km', 'en']

// Cookie-backed so language is known during SSR (no localStorage flash,
// and search engines get consistent content on first render).
export function useLang() {
  const lang = useCookie<Lang>('v168_lang', {
    default: () => 'km',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  function t(key: string): string {
    const entry = translations[key]
    if (!entry) return key
    return entry[lang.value] || entry.en || key
  }

  function set(next: Lang) {
    lang.value = next
  }

  function cycle() {
    const idx = order.indexOf(lang.value)
    lang.value = order[(idx + 1) % order.length]
  }

  const flag = computed(() => flags[lang.value])

  return { lang, t, set, cycle, flag }
}
