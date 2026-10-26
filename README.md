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
Para ver onde os anúncios ficam: `VITE_ADS_PREVIEW=1 npm run dev`.

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
├── ads.ts           regras e configuração dos anúncios
├── storage.ts       salvamento local versionado (pulso:save:v1)
├── dailyChallenge.ts data local e seeds
└── share.ts         Web Share API com fallback de copiar
```

## Ajustando a sensação do jogo

Todos os números ficam em `src/game/config.ts`: `SCORE`, `DIFFICULTY`, `PATTERN_WEIGHTS`, `TIMING`. Os valores atuais são de partida — ajuste após testar com pessoas reais. O teste `sempre há tempo para trocar de trilho` em `tests/difficulty.test.ts` garante uma janela mínima de reação.

## Configuração (`.env`)

Tudo é público (vai para o navegador). No Cloudflare Pages, sobrescreva em **Settings → Environment variables**.

| Variável | Para quê |
| --- | --- |
| `VITE_SITE_URL` | URL pública, sem barra final. Vai para a canônica, sitemap, robots, Open Graph e o botão Compartilhar. Padrão: `https://pulso.pages.dev` |
| `VITE_CONTACT_EMAIL` | E-mail exibido na página de privacidade (opcional) |
| `VITE_ADSENSE_CLIENT` | ID de editor `ca-pub-…`. Vazio = nenhum script ou espaço de anúncio |
| `VITE_ADSENSE_SLOT_MENU` / `_RESULTS` / `_SIDE` | IDs dos blocos de anúncio. Bloco sem ID fica desligado |
| `VITE_ADS_PREVIEW` | `1` mostra caixas tracejadas no lugar dos anúncios, para testar o layout |

## SEO

- `<title>`, description, URL canônica, Open Graph/Twitter com `og-image.jpg` (1200×630) e dados estruturados (`VideoGame`, `WebSite`, `FAQPage`).
- Texto estático "Sobre / Como jogar / Modos / Perguntas frequentes" no `index.html`, abaixo da área de jogo — indexável mesmo sem JavaScript.
- `robots.txt` e `sitemap.xml` gerados na build a partir de `VITE_SITE_URL` (`build/sitePlugin.ts`).
- Manifest + ícones (instalável na tela inicial) e `public/_headers` com cache longo para `/assets/*`.
- O Phaser (~1,2 MB) carrega sob demanda: o primeiro carregamento tem ~85 KB de JS, e o motor é baixado em segundo plano enquanto o menu está aberto.

Depois de publicar: cadastre o site no [Google Search Console](https://search.google.com/search-console), envie `https://<seu-site>/sitemap.xml` e teste a prévia de compartilhamento colando o link no WhatsApp.

## Anúncios (Google AdSense)

Somente banners, nunca durante a partida:

| Tela | Posição | Formato |
| --- | --- | --- |
| Menu (celular) | rodapé, só se a tela tiver ≥ 720 px de altura | 320×50 |
| Resultado (celular) | topo, com o placar entre o anúncio e os botões | 320×50 |
| Menu e resultado (telas largas) | ao lado da área de jogo | 160×600 |

Regras no código (`src/ads.ts`, `src/composables/useAdLayout.ts`):
- pelo menos **150 px** entre anúncio e botões/área de jogo (recomendação do AdSense contra cliques acidentais);
- um pedido novo por posição no máximo a cada **30 s**, mesmo com reinícios rápidos;
- bloqueador de anúncios ou bloco sem anúncio não quebram nada (o espaço fica vazio).

### Ativando

1. Crie a conta no AdSense e adicione o site (`pulso.pages.dev` ou o domínio final).
2. Coloque o `ca-pub-…` em `VITE_ADSENSE_CLIENT` e publique. A build passa a incluir a meta de verificação, o script do AdSense e o `ads.txt`.
3. Aguarde a aprovação. Depois crie 3 blocos **Display** de tamanho fixo (320×50, 320×50 e 160×600) e preencha `VITE_ADSENSE_SLOT_MENU`, `_RESULTS` e `_SIDE`.
4. Em **Privacidade e mensagens**, ative a mensagem de consentimento (CMP do Google) para Europa/Reino Unido/Suíça. O script já carrega essa mensagem; não precisa mudar o código.
5. Deixe **Anúncios automáticos** desligados: eles podem colocar anúncios sobre a área de jogo.

> Em subdomínios de hospedagem (`*.pages.dev`) a aprovação é incerta: você não controla o domínio raiz, e o `ads.txt` deveria ficar nele. Um domínio próprio é o caminho mais seguro: conecte em **Custom domains** no Cloudflare Pages e atualize `VITE_SITE_URL`.

## Publicação no Cloudflare Pages

1. Suba o repositório para o GitHub.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command `npm run build`, output directory `dist`, variável `NODE_VERSION=22`.
4. Ajuste `VITE_SITE_URL` (e as de AdSense, quando tiver) nas variáveis de ambiente do projeto.

A build usa `base: './'`, então também funciona em subdiretórios (`VITE_BASE=/pulso/ npm run build` força um caminho absoluto).

## Honestidade dos recordes

Os recordes são **locais** ("Meu recorde", "Melhor resultado neste dispositivo"). Não há ranking global e o resultado do cliente não é prova de desempenho. Um ranking real exigiria backend com validação das partidas no servidor.

O jogo não tem analytics. Os únicos terceiros são os anúncios do AdSense, quando configurados — descritos em `privacidade.html`.
