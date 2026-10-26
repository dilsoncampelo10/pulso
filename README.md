# PULSO

Jogo arcade 2D de reflexo para navegador. Troque de trilho, desvie dos obstáculos, colete energia e bata o seu recorde.

- **Vue 3** (Composition API) — menu, HUD, resultado, navegação
- **Phaser 3** — somente a área de gameplay (canvas)
- **TypeScript** + **Vite** — build estática, sem backend
- Recordes e preferências no `localStorage` (apenas neste dispositivo)

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes de determinismo, dificuldade e salvamento
npm run build      # gera dist/
npm run preview    # testa a build localmente
```

Para testar no celular na mesma rede: `npm run dev -- --host` e abra o IP mostrado no terminal.

## Controles

| Desktop | Celular |
| --- | --- |
| `Espaço` ou clique alterna o trilho; `←`/`→` (ou `A`/`D`) escolhem o trilho | Toque em qualquer lugar da área de jogo |

## Modos

- **Infinito** — sequência aleatória; a dificuldade sobe a cada 15 s.
- **Desafio diário** — mesma sequência para todos na mesma data e versão. A seed é `pulso-v1:YYYY-MM-DD:daily` (data local do aparelho). É casual: sem servidor, a data do dispositivo pode ser alterada.

> Se mudar a geração de padrões (`src/game/obstacles.ts`) ou o PRNG, incremente `ALGORITHM_VERSION` em `src/game/config.ts`. O teste de snapshot em `tests/random.test.ts` avisa quando a sequência diária mudou.

## Estrutura

```text
src/
├── components/      GameCanvas (ponte Vue↔Phaser), GameHud, MainMenu, ResultsPanel
├── composables/     useGame — estados menu/playing/gameOver e modo endless/daily
├── game/
│   ├── config.ts    TODAS as constantes de gameplay (pontuação, velocidade, spawn…)
│   ├── GameScene.ts cena Phaser: trilhos, jogador, obstáculos, coleta, colisão
│   ├── obstacles.ts gerador de padrões (nunca bloqueia os dois trilhos)
│   ├── difficulty.ts níveis, velocidade e intervalo de spawn
│   ├── random.ts    PRNG determinístico (FNV-1a + mulberry32)
│   └── sound.ts     efeitos sintetizados com Web Audio (sem arquivos)
├── storage.ts       salvamento local versionado (pulso:save:v1)
├── dailyChallenge.ts data local e seeds
└── share.ts         Web Share API com fallback de copiar
```

## Ajustando a sensação do jogo

Todos os números ficam em `src/game/config.ts`: `SCORE`, `DIFFICULTY`, `PATTERN_WEIGHTS`, `TIMING`. Os valores atuais são de partida — ajuste após testar com pessoas reais. O teste `sempre há tempo para trocar de trilho` em `tests/difficulty.test.ts` garante uma janela mínima de reação.

## Publicação

A build usa `base: './'` (caminhos relativos), então funciona na raiz de um domínio **e** em subdiretórios como o GitHub Pages (`/<repo>/`) sem configuração extra. Para um caminho absoluto: `VITE_BASE=/pulso/ npm run build`.

- **Cloudflare Pages:** comando `npm run build`, diretório de saída `dist`.
- **GitHub Pages:** publique o conteúdo de `dist/` (por exemplo com uma GitHub Action de Pages).

Não há chaves secretas, analytics nem rastreamento. Depois de carregado, o jogo não precisa de rede.

## Honestidade dos recordes

Os recordes são **locais** ("Meu recorde", "Melhor resultado neste dispositivo"). Não há ranking global e o resultado do cliente não é prova de desempenho. Um ranking real exigiria backend com validação das partidas no servidor.
