# AutoSoccer Frontend

Frontend do AutoSoccer em Next.js 16 + React 19, integrado a API de mercado,
equipe e batalha assincrona.

## Documentacao formal

### Especifica do front (vive aqui)

- [Arquitetura do front](docs/ARQUITETURA_FRONT.md) — fonte da verdade
  tecnica para a defesa (stack, padroes, decisoes de auth/i18n/dark mode).
- [Defesa front (Lucas Stopinski)](docs/DEFESA_FRONT.md) — 10 perguntas
  previsiveis da banca com respostas curtas, alinhadas com o codigo real.
- [Plano dark mode completo](docs/PLANO_DARK_MODE.md) — 5 fases ja
  executadas: reativar toggle, antd com darkAlgorithm, varrer cores
  hardcoded, validar WCAG.
- [Guia do agente (Claude / contribuidor)](AGENTS.md) — convencoes,
  comandos, layout do repo.

### Compartilhada (vive no [repo server](https://github.com/AutoSoccer/server/tree/main/docs))

Para evitar drift, os docs comuns aos 3 integrantes ficam centralizados
no `server/docs/`:

- `PLANO_APRESENTACAO.md` — cronograma 23/06 + mapeamento da rubrica
- `ROTEIRO_DEMO.md` — 4 fluxos cronometrados + plano B + Fluxo 3.5 (WS)
- `SLIDES_CONTENT.md` — script completo dos 28 slides (`AutoSoccer_Apresentacao.pptx`)
- `DEFESA_BACK.md` e `DEFESA_INFRA.md` — defesas do Pedro e Lucas Bruno
- `EVIDENCIAS.md` — rastreabilidade autoria por integrante
- `sprints/` — Planning, Backlog, Review, Retrospective, Burndown
- `apresentacao/` — `.pptx` oficial + `build/gerar.js` para regenerar

## Requisitos

- Node.js 20+
- npm 10+ (lockfile oficial e `package-lock.json`)
- Backend local na porta `3333`

## Como iniciar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Por padrao, o frontend usa `http://localhost:3333` como API. Para alterar:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Comandos

```bash
npm run dev             # Next dev com Turbopack
npm run build           # build de producao
npm run start           # serve o build local
npm run lint            # eslint
npx tsc --noEmit        # typecheck
npm run test            # vitest run (RTL + happy-dom)
npm run test:watch      # vitest watch
npm run test:coverage   # cobertura via v8
npm run test:ui         # dashboard do vitest
npm run i18n:check      # paridade de chaves pt-BR x en
```

## Fluxo principal

1. O mercado e a equipe sao carregados da API.
2. Comprar e vender atletas atualiza o saldo no backend.
3. O jogador posiciona de 1 a 6 atletas.
4. O botao Jogar envia a formacao para `POST /partida/jogar`.
5. A batalha espelha os snapshots em um campo compartilhado 3x6.
6. Movimentos e posse da bola sao animados pelos eventos retornados pelo backend.

## Internacionalizacao

A solucao usa [`next-intl`](https://next-intl.dev/) com fallback no
`Accept-Language` quando o cookie `NEXT_LOCALE` ainda nao foi escolhido. Toda
a configuracao vive em
[`src/i18n/`](src/i18n) e as mensagens em
[`src/i18n/messages/<locale>/<namespace>.json`](src/i18n/messages).

Locales suportados: `pt-BR` (default), `en`.
Namespaces ativos: `common`, `home`, `auth`, `profile`, `game`, `battle`,
`ranking`, `errors`, `validation`.

### Como funciona o LanguageSwitcher

[`src/components/LanguageSwitcher.tsx`](src/components/LanguageSwitcher.tsx)
roda no client, le `useLocale()` para saber o atual e grava o cookie
`NEXT_LOCALE` (`max-age` de 1 ano) com o proximo locale antes de chamar
`window.location.reload()`. O reload e necessario porque o Next 16 com
`next-intl` resolve o locale no server (`src/i18n/request.ts`) e re-renderiza
todas as RSCs com as novas mensagens.

### Adicionar um novo namespace

1. Criar `src/i18n/messages/<locale>/<namespace>.json` em todos os locales
   suportados.
2. Registrar o nome em `namespaces` no arquivo
   [`src/i18n/config.ts`](src/i18n/config.ts).
3. Atualizar o `loadMessages` em
   [`src/i18n/messages/index.ts`](src/i18n/messages/index.ts) para carregar
   o novo namespace.
4. Adicionar o objeto em `testMessages` dentro de
   [`src/__tests__/utils/renderWithProviders.tsx`](src/__tests__/utils/renderWithProviders.tsx)
   para que ele esteja disponivel nos testes.
5. Rodar `npm run i18n:check`.

### Como traduzir (server vs client)

- **Server Components / RSC**:

  ```ts
  import { getTranslations } from "next-intl/server";
  const t = await getTranslations("home");
  return <h1>{t("title")}</h1>;
  ```

- **Client Components**:

  ```tsx
  "use client";
  import { useTranslations } from "next-intl";
  const t = useTranslations("battle");
  ```

Sempre cite o namespace explicitamente. Evite construir chaves dinamicas:
para variacoes, prefira parametros (`t("welcome", { name })`).

### Como rodar a checagem de paridade

```bash
npm run i18n:check
```

O script [`scripts/check-i18n.mjs`](scripts/check-i18n.mjs) compara as
chaves do `pt-BR` (base) com o `en` para cada namespace e falha (exit 1)
listando diferencas. Roda no CI.

## Testes

Estrutura em [`src/__tests__/`](src/__tests__):

- `setup.ts` — bootstrap do Vitest (registra matchers do
  `@testing-library/jest-dom` e carrega mocks globais).
- `mocks/` — stubs reutilizaveis: `router.ts`, `localStorage.ts`, `api.ts`.
- `utils/renderWithProviders.tsx` — helper que envolve o componente com
  `NextIntlClientProvider` (mensagens em `pt-BR`), `AntdProvider` e
  `AuthProvider`. Use sempre que o componente acessar i18n, antd ou
  contexto de auth.
- Testes proximos do codigo: `Componente.test.tsx` ao lado do `.tsx`.

```bash
npm run test            # roda tudo
npm run test:watch      # watch
npm run test:coverage   # cobertura v8
npm run test:ui         # UI interativa
```

Stack de testes: `vitest` + `@testing-library/react` (RTL) + `happy-dom` +
`@testing-library/user-event`.

Nomenclatura: arquivos `.test.tsx` (componentes) / `.test.ts` (utils). Suites
descrevem o sujeito (`describe("LanguageSwitcher", ...)`) e os casos comecam
com o comportamento esperado (`it("alterna entre pt-BR e en ao clicar")`).

## Layout

A pagina de batalha foi refeita em WS-14 e vive em
[`src/app/battle/BattlePage.tsx`](src/app/battle/BattlePage.tsx) com estilos
em [`BattlePage.module.css`](src/app/battle/BattlePage.module.css). Ela usa o
grid compartilhado 3x6 (campo + bola animada) e consome eventos do
`POST /partida/jogar-rodada`.

Layouts compartilhados (header, navegacao, providers) ficam em
[`src/layouts/`](src/layouts) e em
[`src/providers/`](src/providers) (ex.: `AntdProvider`).
