export type FighterSide = 'meron' | 'wala'

// useState makes this a singleton shared across every component in the
// page (SSR-safe) — so one <FighterModal /> instance can be driven from
// either the Live page's active-fight card or the Fights list.
export function useFighterModal() {
  const open = useState('fighterModal.open', () => false)
  const image = useState('fighterModal.image', () => '')
  const fallback = useState('fighterModal.fallback', () => '')
  const name = useState('fighterModal.name', () => '')
  const side = useState<FighterSide>('fighterModal.side', () => 'meron')

  function openFighterModal(imageSrc: string, fallbackSrc: string, fighterName: string, fighterSide: FighterSide) {
    image.value = imageSrc || fallbackSrc
    fallback.value = fallbackSrc
    name.value = fighterName || ''
    side.value = fighterSide
    open.value = true
  }

  function closeFighterModal() {
    open.value = false
  }

  function onModalImgError() {
    image.value = fallback.value
  }

  return { open, image, fallback, name, side, openFighterModal, closeFighterModal, onModalImgError }
}
