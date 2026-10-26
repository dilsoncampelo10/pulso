<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { LastRun } from '../composables/useGame'
import { formatDateKey } from '../dailyChallenge'
import { buildShareMessage, shareResult, type ShareOutcome } from '../share'

const props = defineProps<{ run: LastRun; best: number }>()
const emit = defineEmits<{ restart: []; menu: [] }>()

const againButton = ref<HTMLButtonElement | null>(null)
const shareStatus = ref<ShareOutcome | null>(null)
const sharing = ref(false)

onMounted(() => againButton.value?.focus({ preventScroll: true }))

const isDaily = computed(() => props.run.result.mode === 'daily')
const shareLabel = computed(() => {
  switch (shareStatus.value) {
    case 'copied':
      return 'Mensagem copiada!'
    case 'shared':
      return 'Compartilhado!'
    case 'failed':
      return 'Não foi possível compartilhar'
    default:
      return ''
  }
})

async function onShare(): Promise<void> {
  if (sharing.value) return
  sharing.value = true
  const text = buildShareMessage(props.run.result.score, props.run.result.mode, props.run.dailyDate)
  shareStatus.value = await shareResult(text)
  sharing.value = false
}
</script>

<template>
  <section class="screen results" role="dialog" aria-modal="true" aria-labelledby="results-title">
    <div class="card">
      <h2 id="results-title" class="title">Fim de jogo</h2>
      <p class="mode">
        {{ isDaily && run.dailyDate ? `Desafio diário · ${formatDateKey(run.dailyDate)}` : 'Modo infinito' }}
      </p>

      <p class="score" aria-label="Pontuação obtida">{{ run.result.score }}</p>
      <p v-if="run.newBest" class="badge">Novo recorde!</p>

      <dl class="stats">
        <div>
          <dt>Meu recorde</dt>
          <dd>{{ best }}</dd>
        </div>
        <div v-if="isDaily">
          <dt>Melhor do dia</dt>
          <dd :class="{ highlight: run.newDailyBest }">{{ run.dailyBest ?? 0 }}</dd>
        </div>
        <div>
          <dt>Tempo</dt>
          <dd>{{ run.result.survivedSeconds }}s</dd>
        </div>
        <div>
          <dt>Energia</dt>
          <dd>{{ run.result.energyCollected }}</dd>
        </div>
      </dl>

      <div class="actions">
        <button ref="againButton" class="btn btn-primary" type="button" @click="emit('restart')">
          Jogar novamente
        </button>
        <div class="row">
          <button class="btn btn-secondary" type="button" @click="emit('menu')">Menu</button>
          <button class="btn btn-secondary" type="button" :disabled="sharing" @click="onShare">
            Compartilhar resultado
          </button>
        </div>
      </div>

      <p class="share-status" role="status">{{ shareLabel }}</p>
      <p class="footnote">Melhor resultado neste dispositivo — não há ranking global.</p>
    </div>
  </section>
</template>

<style scoped>
.results {
  justify-content: center;
  background: rgba(5, 6, 15, 0.72);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.card {
  width: min(100%, 320px);
  padding: 24px 20px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(12, 11, 36, 0.92);
  box-shadow: 0 0 40px rgba(155, 92, 255, 0.25);
  text-align: center;
  animation: rise 160ms ease-out;
}
.title {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pink);
}
.mode {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}
.score {
  margin: 10px 0 0;
  font-size: 56px;
  font-weight: 900;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px rgba(46, 242, 255, 0.5);
}
.badge {
  display: inline-block;
  margin: 10px 0 0;
  padding: 3px 12px;
  border-radius: 999px;
  background: var(--gold);
  color: var(--bg);
  font-weight: 800;
  font-size: 13px;
}
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 18px 0;
}
.stats div {
  padding: 8px;
  border-radius: 10px;
  background: rgba(155, 92, 255, 0.08);
}
.stats dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.stats dd {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.stats dd.highlight {
  color: var(--gold);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 10px;
}
.row .btn {
  font-size: 14px;
  padding: 12px 8px;
}
.share-status {
  min-height: 1.2em;
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--cyan);
}
.footnote {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--muted);
}
@keyframes rise {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
  }
}
</style>
