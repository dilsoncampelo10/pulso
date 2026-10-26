<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ADS, adSlotId, adsPreview, adsenseClient, claimAdRequest, requestAd, type AdPlacement } from '../ads'

const props = defineProps<{ placement: AdPlacement }>()

const size = ADS.sizes[props.placement]
const slot = adSlotId(props.placement)
/** Se o intervalo mínimo ainda não passou, mantém o espaço reservado, sem anúncio. */
const active = ref(false)

onMounted(() => {
  if (!adsPreview && !slot) return
  if (!claimAdRequest(props.placement)) return
  active.value = true
  if (!adsPreview) requestAnimationFrame(requestAd) // após o <ins> estar no DOM
})
</script>

<template>
  <aside
    class="ad"
    :class="[`ad-${placement}`, { 'is-preview': adsPreview && active }]"
    :style="{ width: `${size.width}px`, height: `${size.height + 16}px` }"
    aria-label="Publicidade"
  >
    <span class="ad-label">Publicidade</span>
    <template v-if="active">
      <div v-if="adsPreview" class="ad-box" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Anúncio {{ size.width }}×{{ size.height }}
      </div>
      <ins
        v-else
        class="adsbygoogle"
        :style="{ display: 'inline-block', width: `${size.width}px`, height: `${size.height}px` }"
        :data-ad-client="adsenseClient"
        :data-ad-slot="slot ?? undefined"
      ></ins>
    </template>
  </aside>
</template>

<style scoped>
.ad {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
  max-width: 100%;
  overflow: hidden;
}
.ad-label {
  height: 16px;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  opacity: 0.7;
  visibility: hidden;
}
/* O rótulo só aparece quando há anúncio de fato (ou na prévia). */
.ad:has(ins[data-ad-status='filled']) .ad-label,
.ad.is-preview .ad-label {
  visibility: visible;
}
/* Sem anúncio disponível: some, mas mantém o espaço (sem salto de layout). */
.ad :deep(ins[data-ad-status='unfilled']) {
  visibility: hidden;
}
.ad-box {
  display: grid;
  place-items: center;
  border: 1px dashed var(--muted);
  border-radius: 6px;
  color: var(--muted);
  font-size: 12px;
}
</style>
