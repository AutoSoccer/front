# AutoSoccer Front — Workflows

Esta pasta contém os pipelines CI/CD do front (Next.js 16 + React 19 +
antd 6). Os workflows são estruturados por ambiente:

| Workflow                    | Trigger                    | Ambiente   | O que faz                                                                                                          |
| --------------------------- | -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `ci-pr.yml`                 | `pull_request` para `main` | dev        | lint, typecheck, i18n parity, `test:coverage`, `next build`, sobe coverage como artifact e comenta o resumo no PR. |
| `ci-main.yml`               | `push` em `main`           | staging    | mesmas etapas do PR + envia cobertura para SonarCloud.                                                             |
| _(sem `cd-production.yml`)_ | —                          | production | Não existe pipeline explícito de deploy.                                                                           |

## Por que não há `cd-production.yml`?

O deploy de produção do front é feito **automaticamente pela
[Vercel](https://vercel.com/)**:

- Cada push em `main` dispara um **production deploy** na Vercel.
- Cada Pull Request gera um **preview deploy** com URL exclusiva (útil
  pra revisão visual antes do merge).
- A Vercel cuida do build, edge cache, otimização de imagens, etc.

Por isso o `ci-main.yml` apenas valida o código (lint/typecheck/test/build)
e empurra cobertura pro Sonar — o deploy em si é responsabilidade da
Vercel, configurada via integração GitHub no painel do projeto.

Caso queira mudar essa estratégia (por exemplo, gatear o deploy Vercel
através de um workflow), use a [Vercel CLI](https://vercel.com/docs/cli)
ou o [Deploy Hook](https://vercel.com/docs/deployments/deploy-hooks)
disparado por `workflow_dispatch`.

## Package manager

Embora o repo tenha um `yarn.lock` legado, **o lockfile oficial é
`package-lock.json` (npm)**, conforme `AGENTS.md`. Todos os workflows
usam `npm ci` / `npm run`.

## Secrets necessárias

Configurar em **Settings → Secrets and variables → Actions**:

- `SONAR_TOKEN` — token do projeto no [SonarCloud](https://sonarcloud.io).

(O deploy Vercel não precisa de secret GitHub — ele usa a integração
GitHub OAuth no painel da Vercel.)
