<script setup lang="ts">
import { computed } from 'vue'
import { formatDateKey } from '../dailyChallenge'
import type { GameMode } from '../game/types'

const props = defineProps<{
  score: number
  multiplier: number
  mode: GameMode
  best: number
  bestLabel: string
  dateKey: string
}>()

const modeLabel = computed(() =>
  props.mode === 'daily' ? `Diário · ${formatDateKey(props.dateKey)}` : 'Infinito',
)
const showMultiplier = computed(() => props.multiplier > 1)
const beatingBest = computed(() => props.best > 0 && props.score > props.best)
</script>

<template>
  <!-- pointer-events: none — toques atravessam o HUD e chegam ao jogo -->
  <header class="hud" aria-live="off">
    <div class="hud-left">
      <span class="mode" :class="mode">{{ modeLabel }}</span>
      <span class="best" :class="{ beating: beatingBest }">
        {{ beatingBest ? 'Novo recorde!' : `${bestLabel} ${best}` }}
      </span>
    </div>
    <div class="hud-right">
      <span class="score" aria-label="Pontuação">{{ score }}</span>
      <span v-if="showMultiplier" class="mult">x{{ multiplier.toFixed(1) }}</span>
    </div>
  </header>
</template>

<style scoped>
.hud {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: max(12px, env(safe-area-inset-top)) 14px 12px;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(5, 6, 15, 0.85), rgba(5, 6, 15, 0));
}
.hud-left,
.hud-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hud-right {
  align-items: flex-end;
}
.mode {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cyan);
}
.mode.daily {
  color: var(--violet-soft);
}
.best {
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.best.beating {
  color: var(--gold);
  font-weight: 700;
}
.score {
  font-size: clamp(30px, 9vmin, 44px);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  text-shadow: 0 0 14px rgba(46, 242, 255, 0.45);
}
.mult {
  font-size: 13px;
  font-weight: 800;
  color: var(--bg);
  background: var(--gold);
  border-radius: 999px;
  padding: 2px 8px;
  font-variant-numeric: tabular-nums;
}
</style>
