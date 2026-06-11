# Arquitetura do Front-end — AutoSoccer

> Guia técnico de autoria para defesa na banca (23/06/2026).
> Cada seção descreve o que o código REALMENTE faz — use para responder perguntas dos professores Cleverson e Vinícius.
> Integrante responsável: **Lucas Stopinski da Silva**

---

## Stack

| Tecnologia | Versão | Por que foi escolhida |
|---|---|---|
| Next.js | 16.2 | App Router com Server Components por padrão; Turbopack para dev rápido |
| React | 19.2 | Concurrent features, hooks estáveis |
| TypeScript | 5 | `strict` mode — pega erros de contrato com a API em tempo de compilação |
| antd | 6 | Componentes acessíveis prontos (Form, Modal, Table) + theming por tokens (essencial pro dark mode) |
| next-intl | 4 | i18n integrado ao App Router; resolve locale no servidor sem JS extra no cliente |
| axios | — | Interceptors de request/response permitem injetar token e tratar 401 globalmente |
| vitest + RTL | 4 / 16 | Vitest roda no mesmo bundler do projeto (Vite); RTL testa comportamento, não implementação |
| CSS Modules | — | Escopo local por componente; sem colisão de classes |

---

## Autenticação

### Como funciona na prática

1. Usuário preenche o form de login → `authService.login()` chama `POST /auth/login`
2. Backend retorna `{ token, user }` no body da resposta (JWT simples, **não cookie**)
3. Front salva em `localStorage.setItem("token", ...)` e `localStorage.setItem("user", ...)`
4. `AuthContext` atualiza o estado `user` em memória via `setUser(response.user)`
5. Em todo request seguinte, o interceptor do axios injeta `Authorization: Bearer <token>`

### Por que localStorage e não cookie httpOnly?

Decisão consciente de simplicidade para o contexto acadêmico. Cookie httpOnly seria mais seguro contra XSS (JS não consegue ler), mas exigiria `withCredentials: true` em todo request e configuração de `SameSite` no servidor. O tradeoff foi aceito porque o projeto não lida com dados sensíveis reais.

> **Resposta curta para a banca:** "Usamos localStorage com Bearer token no header Authorization. É mais simples de implementar e suficiente para o escopo do projeto — em produção real, migrar para cookie httpOnly seria o próximo passo de segurança."

### Arquivos relevantes

- [`src/providers/api.ts`](../src/providers/api.ts) — interceptors do axios (injeta token, redireciona no 401)
- [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx) — estado global de autenticação
- [`src/services/authService.ts`](../src/services/authService.ts) — chamadas HTTP de auth
- [`src/hooks/useAuth.tsx`](../src/hooks/useAuth.tsx) — hook que consome o contexto

### Fluxo do interceptor de resposta (logout automático)

```
Request qualquer → 401 recebido → interceptor remove token do localStorage
                                → window.location.href = '/auth/login'
```

O redirecionamento via `window.location.href` (não `router.push`) garante que o estado do React seja completamente resetado — sem dados de usuário anterior vazando entre sessões.

---

## i18n (internacionalização)

### Como funciona

- Dois locales: `pt-BR` (padrão) e `en`
- Mensagens em `src/i18n/messages/<locale>/<namespace>.json`
- `next-intl` resolve o locale no servidor via `src/i18n/request.ts` (lê cookie `NEXT_LOCALE`)

### Server Component vs Client Component

```ts
// Server Component (page.tsx, layout.tsx)
const t = await getTranslations("battle");
return <h1>{t("title")}</h1>;

// Client Component ("use client")
const t = useTranslations("battle");
return <h1>{t("title")}</h1>;
```

A mesma chave funciona nos dois contextos — a diferença é só como se obtém a função `t`.

### Paridade obrigatória

O script `npm run i18n:check` (`scripts/check-i18n.mjs`) compara as chaves de `pt-BR` com `en` e falha se houver divergência. O CI roda esse check antes do build.

> **Resposta para a banca:** "Toda chave nova precisa existir nos dois arquivos de idioma. O script de paridade garante isso automaticamente no pipeline — se uma tradução estiver faltando, o PR não passa."

### Arquivos relevantes

- [`src/i18n/config.ts`](../src/i18n/config.ts) — locales e namespaces registrados
- [`src/i18n/request.ts`](../src/i18n/request.ts) — resolução de locale no servidor
- [`src/i18n/messages/pt-BR/`](../src/i18n/messages/pt-BR/) — mensagens em português
- [`src/i18n/messages/en/`](../src/i18n/messages/en/) — mensagens em inglês
- [`scripts/check-i18n.mjs`](../scripts/check-i18n.mjs) — script de paridade

---

## Dark Mode

### Como funciona

1. `ThemeSwitcher` detecta a preferência atual lendo `document.documentElement.dataset.theme`
2. Ao clicar, chama uma Server Action que reescreve o cookie `NEXT_THEME`
3. Chama `router.refresh()` para o servidor re-renderizar o layout com o novo tema
4. `app/layout.tsx` (Server Component) lê o cookie e escreve `data-theme="dark"` no `<html>` antes do React montar

### Por que não FOUC (Flash Of Unstyled Content)?

Porque o `data-theme` é escrito pelo servidor no HTML inicial — antes de qualquer JS carregar. As CSS variables do tema (`--color-bg`, `--color-text`, etc.) já resolvem com os valores corretos na primeira pintura do browser.

Se usássemos `useEffect` para aplicar o tema (abordagem comum errada), haveria um flash: o HTML chegaria sem `data-theme`, o browser pintaria com tema claro, e só depois o JS aplicaria o escuro.

### CSS Variables

Definidas em [`src/app/globals.css`](../src/app/globals.css):

```css
:root[data-theme="light"] {
  --color-bg: #ffffff;
  --color-text: #0a0a0a;
  /* ... */
}

:root[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-text: #ededed;
  /* ... */
}
```

Contraste WCAG AAA garantido — razão de contraste ≥ 7:1 para texto principal.

> **Resposta para a banca:** "O tema é aplicado pelo servidor antes do React montar, então não tem flash. O cookie persiste a preferência entre sessões."

---

## Drag-and-drop do Mercado

### Como funciona

Usa a **API nativa de Drag and Drop do HTML5** — sem biblioteca externa (sem react-dnd, sem dnd-kit).

1. `AthleteMarketItem` tem o atributo `draggable` e handlers `onDragStart` que gravam o ID no `dataTransfer`
2. Cada slot do campo tem `onDragOver` (permite soltar) e `onDrop` (lê o ID e chama `buyAthlete`)
3. Estado local `dragOverId` controla o highlight visual do slot

### Por que HTML5 nativo e não react-dnd?

O caso de uso é simples (um único tipo de item arrastável para um único tipo de destino). react-dnd adiciona ~30kb ao bundle e sua API de contextos complicaria um componente que já funciona com 50 linhas de handlers nativos.

> **Resposta para a banca:** "Usamos a API de Drag and Drop do próprio browser — atributo `draggable` e eventos `onDragStart`/`onDrop`. Não precisamos de biblioteca porque o caso de uso é direto."

### Arquivos relevantes

- [`src/components/AthleteMarketItem.tsx`](../src/components/AthleteMarketItem.tsx) — componente draggable
- [`src/app/game/MarketPage.tsx`](../src/app/game/MarketPage.tsx) — drop zones e lógica de compra

---

## Batalha ao Vivo (WebSocket)

### Fluxo completo

```
BattlePage monta
    → gameService.playMatch(positions)   [POST /match/play]
    → servidor executa simulação, persiste no DB
    → resposta: { matchId, wsUrl, ...resultado }

Se matchId presente E token no localStorage:
    → useBattleStream.connect(matchId, token)
    → abre WebSocket: wss://host/ws/battle/:matchId?token=<jwt>
    → servidor emite { type: "turn", data: MatchEvent } × 12 (800ms entre cada)
    → servidor emite { type: "result", data: MatchResponse }
    → BattlePage reage via wsState: streaming → finished → modal

Se matchId ausente OU sem token (fallback):
    → startEventAnimation() — setInterval de 850ms exibindo turnos localmente
```

### Hook useBattleStream — máquina de estados

```
idle → connecting → streaming → finished
                 ↘ error (timeout 5s sem abrir, onerror, mensagem type:"error")
```

- **Por que query param `?token=` e não header?**
  A browser WebSocket API não suporta headers customizados. A única forma de passar credenciais é via query param ou subprotocol. Escolhemos query param pela simplicidade.

- **Por que `ws://` vs `wss://`?**
  O hook detecta `window.location.protocol === "https:"` e usa `wss://` automaticamente. Em produção (Vercel = HTTPS) o WebSocket é sempre encriptado.

- **Por que fallback local?**
  Garante que a batalha funciona mesmo se o WebSocket falhar (instabilidade de rede, Railway reiniciando). Zero regressão na experiência.

### Arquivos relevantes

- [`src/hooks/useBattleStream.ts`](../src/hooks/useBattleStream.ts) — hook com máquina de estados
- [`src/app/battle/BattlePage.tsx`](../src/app/battle/BattlePage.tsx) — integração do hook e UI
- [`src/services/gameService.ts`](../src/services/gameService.ts) — `PlayMatchResponse` com `matchId`

---

## Testes

### Infraestrutura

- **Vitest 4** rodando em `happy-dom` (simulação de browser)
- **`renderWithProviders`** envolve componentes com `NextIntlClientProvider` (pt-BR), `AntdProvider` e `AuthProvider` — evita boilerplate repetido
- **Mocks reutilizáveis** em `src/__tests__/mocks/`: `api.ts` (axios), `localStorage.ts`, `router.ts` (next/navigation)

### Como mockar o axios nas suites

```ts
import "@/__tests__/mocks/api";          // já ativa o vi.mock automaticamente
import { mockApiPost, resetApiMocks } from "@/__tests__/mocks/api";

beforeEach(() => { resetApiMocks(); });
mockApiPost({ token: "jwt-abc", user: { id: 1 } });
```

### Como mockar o WebSocket (useBattleStream)

```ts
class MockWebSocket {
  static OPEN = 1;
  // construtor captura a instância em `lastWs`
  constructor(url) { lastWs = this; }
  close = vi.fn();
  simulateMessage(data) { this.onmessage({ data: JSON.stringify(data) }); }
}
vi.stubGlobal("WebSocket", MockWebSocket);
```

### Cobertura atual

- Frontend: **~94%** de cobertura (medida por V8 no Vitest)
- 144 testes passando, 19 arquivos de teste

> **Resposta para a banca:** "Testamos comportamento, não implementação. Cada teste simula uma ação do usuário e verifica o que aparece na tela — não inspecionamos estado interno. O `renderWithProviders` abstrai os providers obrigatórios para não repetir setup em cada suite."

---

## Perguntas prováveis da banca e respostas curtas

### "Por que Next.js App Router e não Pages Router?"
App Router é o modelo recomendado desde o Next.js 13. Dá SSR por padrão com Server Components, o que reduz JS enviado ao cliente. Em Pages Router, tudo seria client-side por padrão. No AutoSoccer, só componentes com estado ou eventos do browser têm `"use client"`.

### "Como vocês garantem que o dark mode não pisca?"
O `data-theme` é escrito pelo servidor no HTML antes do React montar. CSS variables já resolvem os valores corretos na primeira pintura. Se usássemos `useEffect`, o browser pintaria o tema errado por alguns milissegundos.

### "Por que antd e não Tailwind?"
antd resolve três coisas de uma vez: componentes acessíveis (ARIA correto em Modal, Form, Table), theming por tokens (essencial para dark mode sem CSS duplicado), e i18n integrado em componentes de data e número. Tailwind exigiria integrar tudo isso manualmente.

### "Como o frontend autentica nas rotas da API?"
Token JWT salvo em `localStorage`. O interceptor de request do axios injeta `Authorization: Bearer <token>` em todo request automaticamente. Se o servidor retornar 401, o interceptor de response remove o token do localStorage e redireciona para o login.

### "Como funciona o drag-and-drop?"
API nativa do browser — atributo `draggable` no card do atleta, eventos `onDragStart`/`onDrop` nos slots do campo. Sem biblioteca externa. O `dataTransfer` carrega o ID do atleta entre os eventos.

### "O que é o useBattleStream?"
Hook que gerencia a conexão WebSocket com o servidor durante a batalha. Implementa uma máquina de estados: `idle → connecting → streaming → finished`. Se a conexão falhar ou não existir `matchId` na resposta, cai automaticamente no fallback de animação local.

### "Por que o token WS vai no query param e não no header?"
A API WebSocket do browser não permite headers customizados na conexão. A única forma de passar autenticação é via query param (`?token=`) ou via subprotocol. Query param é mais simples e suficiente para o caso.

### "Como vocês testam componentes com internacionalização?"
O `renderWithProviders` já inclui `NextIntlClientProvider` com as mensagens de `pt-BR`. Não precisamos configurar i18n em cada teste — basta usar `renderWithProviders` em vez de `render`.
