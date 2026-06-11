<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

> Agentes (humanos ou Claude) que vao mexer neste repo: alem de checar o que
> mudou no Next 16, leia o restante deste guia. Ele resume a stack, as
> convencoes vigentes e como executar as tarefas mais comuns sem quebrar
> contratos com o backend ou a paridade i18n.

## Stack atual

- **Next.js 16.2** com App Router e Turbopack (`npm run dev`).
- **React 19.2** (Server Components por padrao; client com `"use client"`).
- **TypeScript 5** em modo `strict`.
- **antd 6** + `@ant-design/icons` (tema injetado via `AntdProvider`).
- **next-intl 4** para i18n (locales `pt-BR` default + `en`).
- **axios** para chamadas ao server (`http://localhost:3333`).
- **react-hook-form** + **zod** (com `@hookform/resolvers`) para forms.
- **vitest 4** + `@testing-library/react` 16 + `happy-dom` 20.
- **lucide-react** para icones avulsos quando antd nao cobre.

Lockfile oficial e o `package-lock.json` (npm). Existe um `yarn.lock`
legado — nao use yarn para instalar.

> **Lockfile e o bug npm/cli#4828:** o vitest 4 usa `rolldown`, que tem
> bindings nativos por plataforma como `optionalDependencies`. Quando
> voce roda `npm install` no Mac, o npm REMOVE do lockfile as entries de
> outras plataformas (linux-x64-gnu, win32-x64, etc), o que quebra o CI
> e o deploy Vercel/Railway com `Cannot find @rolldown/binding-linux-x64-gnu`.
>
> Mesma classe de bug afeta `lightningcss`, `@tailwindcss/oxide` e
> `@rollup/rollup`. Issue: https://github.com/npm/cli/issues/4828
>
> **Disciplina do time:** sempre que mexer em deps (`npm install <pkg>`,
> `npm uninstall`, `npm update`), rode em seguida:
>
> ```bash
> npm run lock:linux    # regenera o lockfile dentro de container Linux
> npm install           # reinstala node_modules local com bindings darwin
> ```
>
> Requer Docker Desktop instalado. O script vive em `scripts/lock-linux.sh`.

## Layout do repo

```
src/
  app/                 rotas App Router (RSC por padrao)
    auth/              login + register
    battle/            BattlePage (refeita em WS-14)
    game/, profile/, ranking/
    layout.tsx, page.tsx, globals.css
  components/          componentes compartilhados (LanguageSwitcher, ...)
  views/, layouts/     composicoes de UI maiores
  context/             React contexts (AuthContext, ...)
  providers/           providers de root (AntdProvider, ...)
  hooks/, utils/, lib/, store/, services/, configs/
  i18n/
    config.ts          locales + namespaces ativos
    request.ts         getRequestConfig (server-side locale resolution)
    messages/<locale>/ mensagens por namespace
  __tests__/
    setup.ts           bootstrap do vitest
    utils/renderWithProviders.tsx
    mocks/             router, api, localStorage
scripts/check-i18n.mjs  paridade pt-BR x en
```

## Convencoes

- **Branches**: `feat|fix|test|docs|chore|refactor/ws-XX-<slug>` +
  integracoes em `integration/grupo-N`.
- **Commits**: Conventional Commits em **pt-BR sem acentos**, titulo <= 72
  chars, imperativo (`adiciona`, `corrige`). Detalhes em
  [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Testes**: nome igual ao arquivo testado (`Componente.test.tsx`).
  `describe` descreve o sujeito; `it` descreve o comportamento esperado.
- **Estilo**: CSS Modules (`*.module.css`) por componente; globais em
  `src/app/globals.css`. Antd primeiro, lucide quando necessario.
- **Imports**: alias `@/*` configurado no `tsconfig` aponta para `src/*`.

## Comandos uteis

```bash
npm run dev             # Next dev com Turbopack
npm run build           # build de producao
npm run start           # serve o build
npm run lint            # eslint (config next)
npx tsc --noEmit        # typecheck (idem CI)
npm run test            # vitest run
npm run test:watch      # vitest em watch
npm run test:coverage   # cobertura v8
npm run test:ui         # UI interativa
npm run i18n:check      # paridade pt-BR x en
```

Pipeline CI esperado (Node 20): `npm ci`, `npm run lint`, `npx tsc --noEmit`,
`npm run i18n:check`, `npm run test`, `npm run build`.

## Como adicionar uma pagina i18n-friendly

1. Criar `src/app/<slug>/page.tsx`.
2. Em Server Components, traduzir com `getTranslations`:

   ```ts
   import { getTranslations } from "next-intl/server";
   export default async function Page() {
     const t = await getTranslations("home");
     return <h1>{t("title")}</h1>;
   }
   ```

3. Em Client Components (`"use client"`), use `useTranslations(namespace)`.
4. Adicione as chaves no namespace correto em
   `src/i18n/messages/pt-BR/<ns>.json` **e** `en/<ns>.json`.
5. Para namespace novo: registrar em
   [`src/i18n/config.ts`](src/i18n/config.ts), carregar em
   [`src/i18n/messages/index.ts`](src/i18n/messages/index.ts) e adicionar
   em `testMessages` de
   [`src/__tests__/utils/renderWithProviders.tsx`](src/__tests__/utils/renderWithProviders.tsx).
6. Rodar `npm run i18n:check`.

## Como rodar testes com RTL

1. Importe `renderWithProviders` em vez de `render`:

   ```tsx
   import {
     renderWithProviders,
     screen,
   } from "@/__tests__/utils/renderWithProviders";
   ```

   Ele ja envolve o componente com `NextIntlClientProvider` (`pt-BR`),
   `AntdProvider` e `AuthProvider`.

2. Para interacoes:

   ```tsx
   import userEvent from "@testing-library/user-event";
   const user = userEvent.setup();
   await user.click(screen.getByRole("button", { name: /jogar/i }));
   ```

3. Mocks reutilizaveis vivem em `src/__tests__/mocks/`. Use e estenda em
   vez de criar paralelos.

4. Para components que dependem do router do Next 16, mocke via
   [`src/__tests__/mocks/router.ts`](src/__tests__/mocks/router.ts).

5. Rode `npm run test:watch` durante o desenvolvimento e `npm run test`
   antes de commitar.

## Integracao com a API

- Base URL default: `http://localhost:3333` (configuravel via
  `NEXT_PUBLIC_API_URL`).
- Os contratos sao consumidos via `axios` em `src/services/`. Erros vem no
  shape `{ code, message }` documentado no
  [server/docs/i18n-errors.md](../server/docs/i18n-errors.md).
- Para autenticacao, ver `src/context/AuthContext.tsx` e o middleware do
  backend (`/auth/*`).
