# Cheat Sheet de Defesa — Front-end

> **Integrante:** Lucas Stopinski da Silva
> **Disciplina:** Experiencia Criativa BSI PUCPR 2026/1
> **Apresentacao:** 23/06/2026 — defesa individual obrigatoria
> **Documento irmao:** [`ARQUITETURA_FRONT.md`](./ARQUITETURA_FRONT.md) — fonte da verdade tecnica

10 perguntas previsiveis da banca com respostas curtas (2-4 linhas, ~30s de fala). Use como roteiro mental, nao leia literal. Se uma pergunta nao for sua area, redirecione: "essa parte foi conduzida pelo Pedro/Lucas Bruno, mas conheco a decisao."

---

## 1. Por que Next.js App Router e nao Pages Router?
App Router e o modelo recomendado desde a versao 13 e da SSR por padrao com Server Components, que reduz JS no cliente. Layouts aninhados simplificam o `ProfileCorner` e o `ThemeProvider` ficarem em `app/layout.tsx` sem prop drilling. Pages Router ja esta em modo de manutencao e perderia suporte de bibliotecas novas como next-intl 4.

## 2. Como funciona o SSR de tema (dark mode) sem FOUC?
O tema vem de um cookie `NEXT_THEME` lido no `app/layout.tsx` que e Server Component. Antes do React montar, ja escrevemos `data-theme="dark"` no `<html>` e as CSS vars resolvem o visual correto na primeira pintura do navegador. Nao usamos `useEffect` para aplicar tema — isso causaria flash de tela branca.

## 3. Como o i18n e resolvido (server vs client)?
No server, `next-intl` le o cookie `NEXT_LOCALE` ou cai no `Accept-Language` (com parsing de q-factor, nao split ingenuo) para escolher o namespace. As mensagens chegam no client como prop do `NextIntlClientProvider` no layout — sem fetch extra no browser. Componentes server usam `getTranslations()`, client usam `useTranslations()` — mesma API, contextos diferentes.

## 4. Como voce testou os componentes (RTL + Vitest)?
Criei um helper `renderWithProviders` que injeta `NextIntlClientProvider` em pt-BR (com os 9 namespaces pre-carregados), o `AntdProvider` e o `AuthProvider`. Mocks reutilizaveis para axios, localStorage e router em `src/__tests__/mocks/`. Cada teste foca em comportamento — "ao clicar em Comprar, dispara o axios.post correto" — em vez de implementacao. Vitest 4 roda em **happy-dom** (cerca de 2x mais rapido que jsdom), com cobertura V8 medindo branches e linhas. Hoje: ~94% de cobertura, 144 testes em 19 arquivos.

## 5. Por que antd 6 e nao Tailwind ou Material?
antd 6 ja resolve tres coisas que precisariamos integrar a mao com Tailwind: componentes acessiveis (Form, Modal, Drawer com ARIA correto), theming nativo com tokens (essencial pro dark mode — trocamos o tema todo via `ConfigProvider`) e i18n integrado nos componentes de data e numero. Material teria curva maior, visual corporativo demais pra estetica arcade do projeto e bundle mais pesado.

## 6. Como funciona o drag-and-drop do mercado?
Uso a **API nativa de Drag and Drop do HTML5** — sem biblioteca externa. O `AthleteMarketItem` tem atributo `draggable` e handler `onDragStart` que grava o ID no `dataTransfer`. Cada slot do campo tem `onDragOver` com `preventDefault()` (isso e o que habilita o drop — sem isso o browser bloqueia) e `onDrop` (le o ID e dispara a compra). Estado local `dragOverId` controla o highlight visual. Decidi nao usar `react-dnd` porque o caso e simples (1 tipo arrastavel para 1 tipo destino) — a lib traria ~30kb e contextos que nao pagariam o custo, ~50 linhas de handlers nativos resolveram.

## 7. Como o frontend autentica (JWT cookie ou localStorage)?
**localStorage com Bearer token no header `Authorization`** — decisao consciente de simplicidade para o contexto academico e pelo fato de front (Vercel) e back (Railway) estarem em dominios diferentes, o que com cookie httpOnly exigiria `SameSite=None`, `Secure`, CORS com `Access-Control-Allow-Credentials` e protecao contra CSRF. O backend devolve `{ token, user }` no body do `/auth/login`; o front salva em `localStorage` e o `AuthContext` atualiza o estado. Interceptor de request do axios injeta `Authorization: Bearer <token>` em todo request automaticamente. Se vier 401, o interceptor de response limpa o localStorage e redireciona para `/auth/login` via `window.location.href` (reset completo do estado React). Em producao real com dados sensiveis, migrar para cookie httpOnly seria o proximo passo de seguranca contra XSS.

## 8. Como voce lida com hidratacao (`"use client"` vs Server Components)?
Por padrao **tudo e Server Component**. Marco `"use client"` so quando preciso de algo que existe so no browser: `useState`, `useEffect`, event handlers (`onClick`, `onChange`), APIs como `window` e `localStorage`, ou hooks que dependem deles (`useTranslations`, `useRouter`). Componentes de leitura — listas, headers estaticos — ficam Server. O `layout.tsx` e Server porque precisa ler `cookies()` pro tema e o locale. Os interativos — `ThemeSwitcher`, `LanguageSwitcher`, `ProfileCorner`, `MarketPage` com drag handlers — sao Client. **A regra e: Server e o default; Client e a excecao justificada** — assim entregamos menos JS pro navegador.

## 9. Como funciona o ProfileCorner + ThemeSwitcher + LanguageSwitcher?
Sao tres Client Components. O `ProfileCorner` e o container — renderiza `ThemeSwitcher` + `LanguageSwitcher` + avatar com dropdown (Profile/Market/Logout) e tem click-outside via `useEffect` no `mousedown` global. Os dois switchers tem mecanismos **diferentes**:
- **ThemeSwitcher:** ao clicar, atualiza `data-theme` direto no `<html>` via `setAttribute`, grava o cookie `NEXT_THEME` e atualiza o estado local. **Nao precisa de refresh do server** — as CSS vars sao reativas e o navegador repinta na hora. O cookie e so para o proximo SSR ficar consistente.
- **LanguageSwitcher:** grava o cookie `NEXT_LOCALE` e da **`window.location.reload()`** (dentro de `useTransition` para desabilitar o botao durante a transicao). Reload completo e necessario porque as mensagens do `next-intl` sao carregadas pelo servidor por request — trocar em runtime exigiria refazer toda a carga; mais simples deixar o servidor montar tudo novo no idioma novo.

## 10. O que voce mudaria se comecasse de novo?
No processo, teria definido a **arquitetura front e a divisao de tarefas no Sprint 0** — comecamos varias decisoes no meio do caminho (cache com `useState` virou bug em duas telas, auth localStorage vs cookie ficou pra depois). Tecnicamente, adotaria **TanStack Query desde o dia 1** pra cache de dados, **padronizaria os DTOs da API com Zod** pra pegar mudancas de contrato em runtime, e teria coberto as pages do `app/**` com **Playwright** desde a Sprint 2 — hoje a cobertura e 94% mas exclui as pages com SSR. Do back, o Pedro responde melhor que eu.

---

> Documento mantido por Lucas Stopinski. Ultima atualizacao: 20/06/2026.
