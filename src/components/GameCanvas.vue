<script setup lang="ts">
/**
 * Ponte Vue ↔ Phaser. Cria UMA instância Phaser ao montar e a destrói ao
 * desmontar. A cena conversa com o Vue apenas por callbacks tipados — o Phaser
 * nunca mexe no DOM controlado pelo Vue.
 */
import Phaser from 'phaser'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { COLORS, WORLD } from '../game/config'
import { GameScene } from '../game/GameScene'
import type { RunConfig, RunResult, ScoreUpdate } from '../game/types'

const props = defineProps<{ config: RunConfig; runId: number }>()
const emit = defineEmits<{ score: [update: ScoreUpdate]; gameOver: [result: RunResult] }>()

const host = ref<HTMLDivElement | null>(null)
let game: Phaser.Game | null = null
let scene: GameScene | null = null

onMounted(() => {
  if (!host.value) return
  scene = new GameScene({
    onScore: (u) => emit('score', u),
    onGameOver: (r) => emit('gameOver', r),
  })
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host.value,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: COLORS.background,
    banner: false,
    audio: { noAudio: true }, // sons são sintetizados em game/sound.ts
    scale: {
      mode: Phaser.Scale.FIT, // adapta à tela sem distorcer
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, powerPreference: 'high-performance' },
    // O Phaser já pausa o loop quando a aba fica em segundo plano.
  })
  game.scene.add('game', scene, true, props.config)
})

// Nova partida (Jogar novamente): reinicia a mesma cena com a nova config.
watch(
  () => props.runId,
  () => {
    if (scene && scene.sys.isActive()) scene.scene.restart(props.config)
    else game?.scene.start('game', props.config)
  },
)

onBeforeUnmount(() => {
  game?.destroy(true)
  game = null
  scene = null
})
</script>

<template>
  <div ref="host" class="game-canvas" aria-label="Área de jogo" role="application"></div>
</template>

<style scoped>
.game-canvas {
  position: absolute;
  inset: 0;
  /* Sem rolagem, zoom ou seleção acidental — apenas dentro da área de jogo. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.game-canvas :deep(canvas) {
  display: block;
  outline: none;
}
</style>
