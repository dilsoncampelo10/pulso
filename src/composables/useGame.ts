import { computed, readonly, ref, shallowRef } from 'vue'
import { dailySeed, endlessSeed, localDateKey } from '../dailyChallenge'
import { sfx } from '../game/sound'
import type { GameMode, GameState, RunConfig, RunResult, ScoreUpdate } from '../game/types'
import { loadSave, recordResult, writeSave, type SaveData } from '../storage'

export interface LastRun {
  result: RunResult
  newBest: boolean
  /** Data do desafio (somente no modo diário). */
  dailyDate?: string
  dailyBest?: number
  newDailyBest: boolean
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

// Estado único do app (módulo singleton) — sem Pinia, o MVP não precisa.
const state = ref<GameState>('menu')
const mode = ref<GameMode>('endless')
const score = ref(0)
const multiplier = ref(1)
const save = ref<SaveData>(loadSave()) // 1. ao abrir: carrega preferências e recordes
const runConfig = shallowRef<RunConfig | null>(null)
/** Incrementa a cada nova partida; o GameCanvas reinicia a cena quando muda. */
const runId = ref(0)
const lastRun = shallowRef<LastRun | null>(null)
const todayKey = ref(localDateKey())

export function useGame() {
  const todayBest = computed(() => save.value.dailyBest[todayKey.value] ?? 0)

  /** 2. Ao selecionar um modo: nova seed, pontuação zerada, partida iniciada. */
  function start(selected: GameMode): void {
    sfx.unlock() // precisa acontecer dentro do gesto do usuário
    todayKey.value = localDateKey()
    mode.value = selected
    score.value = 0
    multiplier.value = 1
    runConfig.value = {
      mode: selected,
      seed: selected === 'daily' ? dailySeed(todayKey.value) : endlessSeed(),
      soundEnabled: save.value.soundEnabled,
      reducedMotion: prefersReducedMotion(),
    }
    runId.value += 1
    state.value = 'playing'
  }

  /** 5. Reinício: mesma cena, objetos limpos, partida nova. */
  function restart(): void {
    start(mode.value)
  }

  /** 6. Volta ao menu: o GameCanvas é desmontado e o Phaser destruído. */
  function toMenu(): void {
    state.value = 'menu'
    runConfig.value = null
    todayKey.value = localDateKey()
  }

  function onScore(update: ScoreUpdate): void {
    score.value = update.score
    multiplier.value = update.multiplier
  }

  /** 4. Colisão: a cena já congelou; registra o resultado e mostra a tela final. */
  function onGameOver(result: RunResult): void {
    if (state.value !== 'playing') return
    const date = runConfig.value?.mode === 'daily' ? dailySeedDate(runConfig.value.seed) : todayKey.value
    const outcome = recordResult(save.value, result.mode, result.score, date)
    save.value = outcome.save
    writeSave(save.value)
    score.value = result.score
    lastRun.value = {
      result,
      newBest: outcome.newBest,
      dailyDate: result.mode === 'daily' ? date : undefined,
      dailyBest: result.mode === 'daily' ? save.value.dailyBest[date] : undefined,
      newDailyBest: outcome.newDailyBest,
    }
    state.value = 'gameOver'
  }

  function toggleSound(): void {
    save.value = { ...save.value, soundEnabled: !save.value.soundEnabled }
    sfx.enabled = save.value.soundEnabled
    if (save.value.soundEnabled) sfx.unlock()
    writeSave(save.value)
  }

  return {
    state: readonly(state),
    mode: readonly(mode),
    score: readonly(score),
    multiplier: readonly(multiplier),
    save: readonly(save),
    runConfig,
    runId: readonly(runId),
    lastRun,
    todayKey: readonly(todayKey),
    todayBest,
    start,
    restart,
    toMenu,
    onScore,
    onGameOver,
    toggleSound,
  }
}

/** Extrai a data da seed diária, garantindo que o recorde vá para o dia jogado. */
function dailySeedDate(seed: string): string {
  return seed.split(':')[1] ?? localDateKey()
}
