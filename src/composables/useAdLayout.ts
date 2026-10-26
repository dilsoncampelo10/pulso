import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ADS, isPlacementEnabled } from '../ads'

/** Proporções da área de jogo (mesmas do CSS de .stage). */
const STAGE_MIN_RATIO = 9 / 16
const STAGE_MAX_TALL = 19.5 / 9
/**
 * Altura mínima da área de jogo para caber o banner do menu com ADS.safeGap px
 * de distância dos botões (medido em telas de 360×640 a 430×932).
 */
const MENU_INLINE_MIN_HEIGHT = 720

/**
 * Decide onde os anúncios podem aparecer sem ficar perto de botões ou da
 * área de jogo:
 * - telas largas: um bloco vertical ao lado da área de jogo;
 * - telas estreitas: banners dentro do menu e do resultado, se couberem.
 */
export function useAdLayout() {
  const vw = ref(typeof window === 'undefined' ? 0 : window.innerWidth)
  const vh = ref(typeof window === 'undefined' ? 0 : window.innerHeight)

  function measure(): void {
    vw.value = window.innerWidth
    vh.value = window.innerHeight
  }
  onMounted(() => window.addEventListener('resize', measure, { passive: true }))
  onBeforeUnmount(() => window.removeEventListener('resize', measure))

  const stageWidth = computed(() => Math.min(vw.value, vh.value * STAGE_MIN_RATIO))
  const stageHeight = computed(() => Math.min(vh.value, vw.value * STAGE_MAX_TALL))

  const side = computed(() => {
    const free = (vw.value - stageWidth.value) / 2
    return isPlacementEnabled('side') && free >= ADS.sizes.side.width + ADS.safeGap + 16 && vh.value >= ADS.sizes.side.height + 40
  })

  const menuInline = computed(
    () => !side.value && isPlacementEnabled('menu') && stageHeight.value >= MENU_INLINE_MIN_HEIGHT,
  )
  const resultsInline = computed(() => !side.value && isPlacementEnabled('results'))

  return { side, menuInline, resultsInline }
}
