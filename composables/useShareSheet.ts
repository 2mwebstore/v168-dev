// Singleton (via useState) so a single <ShareSheet /> mounted once in app.vue
// can be triggered from anywhere — the video-card share icon in the list,
// or the share button on the video detail page.
export function useShareSheet() {
  const open = useState('shareSheet.open', () => false)
  const url = useState('shareSheet.url', () => '')
  const title = useState('shareSheet.title', () => '')

  function openShareSheet(shareUrl: string, shareTitle?: string) {
    url.value = shareUrl
    title.value = shareTitle || ''
    open.value = true
  }

  function closeShareSheet() {
    open.value = false
  }

  return { open, url, title, openShareSheet, closeShareSheet }
}
