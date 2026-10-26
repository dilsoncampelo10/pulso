<script setup lang="ts">
import { computed } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import GameHud from './components/GameHud.vue'
import MainMenu from './components/MainMenu.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import { useGame } from './composables/useGame'

const game = useGame()
const { state, mode, score, multiplier, save, runConfig, runId, lastRun, todayKey, todayBest } = game

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
        @restart="game.restart"
        @menu="game.toMenu"
      />

      <MainMenu
        v-if="state === 'menu'"
        :best="save.bestScore"
        :today-best="todayBest"
        :date-key="todayKey"
        :sound-enabled="save.soundEnabled"
        @start="game.start"
        @toggle-sound="game.toggleSound"
      />
    </div>
  </main>
</template>
