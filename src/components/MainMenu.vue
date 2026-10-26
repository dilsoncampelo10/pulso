<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatDateKey } from '../dailyChallenge'
import type { GameMode } from '../game/types'

defineProps<{
  best: number
  todayBest: number
  dateKey: string
  soundEnabled: boolean
}>()
const emit = defineEmits<{ start: [mode: GameMode]; toggleSound: [] }>()

const playButton = ref<HTMLButtonElement | null>(null)
onMounted(() => playButton.value?.focus({ preventScroll: true }))
</script>

<template>
  <section class="screen menu" aria-labelledby="menu-title">
    <button
      class="sound-toggle"
      type="button"
      :aria-pressed="soundEnabled"
      :aria-label="soundEnabled ? 'Som ligado. Desligar som' : 'Som desligado. Ligar som'"
      @click="emit('toggleSound')"
    >
      <span aria-hidden="true">{{ soundEnabled ? '🔊' : '🔇' }}</span>
      <span class="sound-label">{{ soundEnabled ? 'Som' : 'Mudo' }}</span>
    </button>

    <div class="logo" aria-hidden="true">
      <span class="ring"></span>
      <span class="core"></span>
    </div>
    <h1 id="menu-title" class="title">PULSO</h1>

    <div class="actions">
      <button ref="playButton" class="btn btn-primary" type="button" @click="emit('start', 'endless')">
        Jogar
      </button>
      <button class="btn btn-secondary" type="button" @click="emit('start', 'daily')">
        <span>Desafio diário</span>
        <small>{{ formatDateKey(dateKey) }} · melhor {{ todayBest }}</small>
      </button>
    </div>

    <dl class="stats">
      <dt>Meu recorde</dt>
      <dd>{{ best }}</dd>
    </dl>

    <p class="hint">
      <span class="key">Toque</span> ou pressione <span class="key">espaço</span> para trocar de trilho
      <br />
      <span class="sub">← → também funcionam</span>
    </p>

    <p class="footnote">Recordes salvos apenas neste dispositivo.</p>
  </section>
</template>

<style scoped>
.menu {
  justify-content: center;
  gap: 18px;
}
.sound-toggle {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(12, 11, 36, 0.7);
  color: var(--muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.sound-toggle:hover {
  color: var(--text);
}
.logo {
  position: relative;
  width: 84px;
  height: 84px;
  margin-bottom: -6px;
}
.ring,
.core {
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 50%;
}
.ring {
  width: 72px;
  height: 72px;
  border: 3px solid var(--violet);
  box-shadow: 0 0 22px rgba(155, 92, 255, 0.55), inset 0 0 14px rgba(155, 92, 255, 0.4);
  animation: pulse 1.6s ease-in-out infinite;
}
.core {
  width: 30px;
  height: 30px;
  background: var(--cyan);
  box-shadow: 0 0 24px var(--cyan);
}
.title {
  margin: 0;
  font-size: clamp(48px, 16vmin, 76px);
  font-weight: 900;
  letter-spacing: 0.24em;
  padding-left: 0.24em; /* compensa o letter-spacing para centralizar */
  color: var(--text);
  text-shadow: 0 0 18px rgba(46, 242, 255, 0.55), 0 0 42px rgba(155, 92, 255, 0.45);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, 280px);
}
.stats {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 4px 0 0;
}
.stats dt {
  color: var(--muted);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.stats dd {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--gold);
}
.hint {
  margin: 6px 0 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
.key {
  display: inline-block;
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.6;
}
.sub {
  font-size: 12px;
  opacity: 0.8;
}
.footnote {
  position: absolute;
  bottom: max(12px, env(safe-area-inset-bottom));
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  opacity: 0.75;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.7;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ring {
    animation: none;
  }
}
</style>
