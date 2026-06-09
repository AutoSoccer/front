# Contribuindo com o front

Este guia define as convencoes em vigor no repositorio `front` do AutoSoccer
(Next.js 16 + React 19 + Turbopack + antd 6 + next-intl + vitest).
Vale para tudo que entrar em `main` (ou em branches de integracao do grupo).

## Branches

Use sempre um dos prefixos abaixo + slug curto + numero do workstream:

- `feat/ws-XX-<slug>` — nova feature
- `fix/ws-XX-<slug>` — bug fix
- `test/ws-XX-<slug>` — adicao/refatoracao de testes
- `docs/ws-XX-<slug>` — documentacao (README, CONTRIBUTING, AGENTS, docs/)
- `chore/ws-XX-<slug>` — build, CI, dependencias, mexidas internas
- `refactor/ws-XX-<slug>` — refatoracao sem mudanca de comportamento

Branches de integracao usam o padrao `integration/grupo-N`.

## Conventional Commits (pt-BR, sem acentos)

Formato: `<tipo>(<escopo opcional>): <descricao no imperativo, ate 72 chars>`.

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
`ci`, `perf`, `build`, `wip` (apenas para snapshots intermediarios).

Regras:

- Tudo em portugues, **sem acentos** no titulo.
- Descricao no imperativo (`adiciona`, `corrige`, `remove`).
- Escopo opcional: nome da pagina, componente ou workstream
  (`feat(battle): ...`, `chore(ci): ...`).
- **Nunca** inclua `Co-Authored-By` automatico nos commits do projeto.
- **Nunca** rode com `--no-verify` salvo pedido explicito.

Exemplos:

```text
feat(battle): adiciona animacao de posse de bola no grid 3x6
fix(auth): corrige redirect apos login com cookie persistido
docs(front): cria CONTRIBUTING.md
chore(ci): adiciona GitHub Actions com lint typecheck e tests
test(LanguageSwitcher): cobre troca de locale e persistencia em cookie
```

## Antes de abrir PR

Rode localmente, na raiz de `front/`:

```bash
npm run lint
npx tsc --noEmit
npm run i18n:check
npm run test
```

O CI (`.github/workflows/ci.yml`) roda exatamente esses passos + `npm run build`
em Node 20. PRs com qualquer step vermelho nao podem ser merge-ados.

## Adicionar uma pagina i18n-friendly

1. Crie a rota no [App Router](https://nextjs.org/docs/app) em
   `src/app/<slug>/page.tsx`.
2. Em RSC, importe o `getTranslations`:

   ```ts
   import { getTranslations } from "next-intl/server";
   export default async function Page() {
     const t = await getTranslations("home");
     return <h1>{t("title")}</h1>;
   }
   ```

3. Em componentes client (`"use client"`), use `useTranslations`.
4. Adicione as chaves no namespace correto em
   `src/i18n/messages/pt-BR/<namespace>.json` **e** `en/<namespace>.json`.
5. Se precisar de um namespace novo:
   - Registre o nome em
     [`src/i18n/config.ts`](src/i18n/config.ts).
   - Carregue em [`src/i18n/messages/index.ts`](src/i18n/messages/index.ts).
   - Adicione em `testMessages` de
     [`src/__tests__/utils/renderWithProviders.tsx`](src/__tests__/utils/renderWithProviders.tsx).
6. Confirme: `npm run i18n:check` deve passar.

## Testes com RTL

- Use sempre o
  [`renderWithProviders`](src/__tests__/utils/renderWithProviders.tsx)
  para componentes que dependem de i18n, antd ou auth.
- Prefira **queries semanticas** (`getByRole`, `getByLabelText`) em vez de
  `getByText` sempre que possivel.
- Para interacoes, use `@testing-library/user-event` (`userEvent.setup()`).
- Para mocks de API, reaproveite
  [`src/__tests__/mocks/api.ts`](src/__tests__/mocks/api.ts) e estenda quando
  preciso.
- Para mocks de router (Next 16) e localStorage, use
  [`src/__tests__/mocks/router.ts`](src/__tests__/mocks/router.ts) e
  [`localStorage.ts`](src/__tests__/mocks/localStorage.ts).

Estrutura:

- Testes ficam ao lado do codigo: `Componente.test.tsx`.
- Suites globais e infra de teste em `src/__tests__/`.

```bash
npm run test            # roda tudo (uma vez)
npm run test:watch      # watch
npm run test:coverage   # cobertura
npm run test:ui         # UI interativa
```

## Estilo de codigo

- `eslint-config-next` + autofix com `npm run lint -- --fix`.
- Componentes Antd 6: prefira `import { Button } from "antd"`; respeite o
  tema do `AntdProvider`.
- CSS Modules (`*.module.css`) para estilo proprio de componente. Variaveis
  globais ficam em `src/app/globals.css`.

## Variaveis sensiveis

- Nunca comite `.env`, tokens reais ou builds (`.next/`, `coverage/`).
- Use prefixo `NEXT_PUBLIC_` apenas para variaveis seguras de expor no
  bundle do browser.
