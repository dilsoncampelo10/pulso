<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import AdSlot from './components/AdSlot.vue'
import GameHud from './components/GameHud.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import MainMenu from './components/MainMenu.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import { useAdLayout } from './composables/useAdLayout'
import { useGame } from './composables/useGame'

// O Phaser (~1.2 MB) só é baixado quando necessário: o menu aparece na hora,
// o que melhora o carregamento (Core Web Vitals) e o SEO.
const GameCanvas = defineAsyncComponent({
  loader: () => import('./components/GameCanvas.vue'),
  loadingComponent: LoadingScreen,
  delay: 120,
})

const game = useGame()
const { state, mode, score, multiplier, save, runConfig, runId, lastRun, todayKey, todayBest } = game
const ads = useAdLayout()

const hudBest = computed(() => (mode.value === 'daily' ? todayBest.value : save.value.bestScore))
const hudBestLabel = computed(() => (mode.value === 'daily' ? 'Melhor do dia' : 'Meu recorde'))
</script>

<template>
  <main class="app">
    <div class="stage" :class="`is-${state}`">
      <!-- O Phaser existe apenas fora do menu; ao voltar ao menu ele é destruído. -->
      <GameCanvas
        v-if="state !== 'menu' && runConfig"
        :config="runConfig"
        :run-id="runId"
        @score="game.onScore"
        @game-over="game.onGameOver"
      />

      <GameHud
        v-if="state === 'playing'"
        :score="score"
        :multiplier="multiplier"
        :mode="mode"
        :best="hudBest"
        :best-label="hudBestLabel"
        :date-key="todayKey"
      />

      <ResultsPanel
        v-if="state === 'gameOver' && lastRun"
        :key="runId"
        :run="lastRun"
        :best="save.bestScore"
        :show-ad="ads.resultsInline.value"
        @restart="game.restart"
        @menu="game.toMenu"
      />

      <MainMenu
        v-if="state === 'menu'"
        :best="save.bestScore"
        :today-best="todayBest"
        :date-key="todayKey"
        :sound-enabled="save.soundEnabled"
        :show-ad="ads.menuInline.value"
        @start="game.start"
        @toggle-sound="game.toggleSound"
      />
    </div>

    <!-- Telas largas: anúncio ao lado, longe da área de jogo, nunca durante a partida. -->
    <div v-if="ads.side.value" class="side-ad">
      <AdSlot v-if="state !== 'playing'" :key="`side-${state}-${runId}`" placement="side" />
    </div>
  </main>
</template>
