/**
 * Constantes centralizadas do PULSO.
 * Os valores são parâmetros de partida — ajuste aqui após testar a sensação do jogo.
 * Nenhum outro arquivo deve ter números "mágicos" de gameplay.
 */

/** Resolução lógica do mundo (retrato). O Phaser escala sem distorcer (Scale.FIT). */
export const WORLD = {
  width: 360,
  height: 640,
} as const

export const LANES = {
  /** Centro X de cada trilho: [esquerdo, direito]. */
  x: [120, 240] as const,
  /** Largura visual de cada trilho. */
  width: 96,
} as const

export const PLAYER = {
  y: 520,
  radius: 18,
  /** Duração do deslize visual entre trilhos (ms). A troca lógica é instantânea. */
  switchTweenMs: 70,
  /** Fração do raio usada na colisão — um pouco mais tolerante que o visual. */
  hitboxScale: 0.8,
} as const

export const OBSTACLE = {
  width: 72,
  height: 34,
  /** Y em que nascem (acima da tela). */
  spawnY: -40,
} as const

export const ENERGY = {
  size: 26,
  /** Raio de coleta (mais generoso que a colisão com obstáculos). */
  pickupRadius: 30,
} as const

export const SCORE = {
  /** Pontos por segundo sobrevivido. */
  perSecond: 10,
  /** Pontos base por núcleo de energia. */
  energy: 50,
  /** Cada coleta consecutiva soma este valor ao multiplicador do bônus. */
  comboStep: 0.5,
  /** Multiplicador máximo do bônus de energia. */
  comboMax: 3,
} as const

export const DIFFICULTY = {
  /** Intervalo, em segundos, entre aumentos de nível. */
  levelEverySeconds: 15,
  /** Velocidade de queda (px/s). */
  baseSpeed: 300,
  speedStep: 35,
  maxSpeed: 620,
  /** Quão rápido a velocidade atual alcança a do novo nível (por segundo). */
  speedEase: 1.5,
  /** Tempo entre eventos de spawn (s). Menor = mais denso. */
  baseInterval: 1.1,
  intervalStep: 0.08,
  minInterval: 0.5,
  /** Respiro inicial antes do primeiro obstáculo (s). */
  warmup: 1.2,
} as const

/**
 * Probabilidades de cada padrão de spawn (somam 1).
 * Nunca há obstáculos nos dois trilhos ao mesmo tempo no MVP.
 */
export const PATTERN_WEIGHTS = {
  obstacle: 0.68,
  obstacleWithEnergy: 0.17,
  energy: 0.15,
} as const

export const TIMING = {
  /** Maior delta aceito por frame (s) — evita "teleporte" ao voltar de outra aba. */
  maxDelta: 1 / 20,
  /** Pausa entre a colisão e a tela de resultado (ms). Curta para reinício rápido. */
  gameOverDelayMs: 380,
  /** Ignora um segundo toque/clique dentro desta janela (ms). */
  pointerDebounceMs: 60,
} as const

export const COLORS = {
  background: 0x05060f,
  grid: 0x1a1640,
  lane: 0x9b5cff,
  laneFill: 0x0c0b24,
  player: 0x2ef2ff,
  playerRing: 0xb6fbff,
  obstacle: 0xff3d6e,
  obstacleEdge: 0xffc2d1,
  energy: 0xffd23f,
  spark: 0xfff3b0,
  crash: 0xff3d6e,
} as const

/** Identificador da versão do algoritmo de geração (entra na seed do desafio diário). */
export const ALGORITHM_VERSION = 'pulso-v1'
