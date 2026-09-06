export function useApiBase() {
  const config = useRuntimeConfig()
  return config.public.apiBase
}

// Compares a date string against "today" in Cambodia time (Asia/Phnom_Penh),
// not the visitor's local time — used by the Today filters on Videos/Fights.
const phnomPenhDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Phnom_Penh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function parseApiDate(str?: string | null): Date | null {
  if (!str) return null
  const iso = str.includes('T') ? str : str.replace(' ', 'T')
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

export function isTodayInPhnomPenh(str?: string | null): boolean {
  const d = parseApiDate(str)
  if (!d) return false
  return phnomPenhDateFmt.format(d) === phnomPenhDateFmt.format(new Date())
}

export function timeAgo(str?: string | null): string {
  const d = parseApiDate(str)
  if (!d) return ''
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}
