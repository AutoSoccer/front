# Plano de Implementação — Dark Mode Completo

> **Para:** Sonnet (executor)
> **De:** Lucas Stopinski (com investigação Opus)
> **Data:** 20/06/2026
> **Prazo:** apresentação 23/06/2026 — completar antes da terça
> **Pre-requisito:** ler [`ARQUITETURA_FRONT.md`](ARQUITETURA_FRONT.md) seção "Dark Mode"

## Contexto

O dark mode atual está **parcial** — só muda bordas e alguns textos. Cards, fundos e componentes do antd ficam em light mesmo com `data-theme="dark"`. Este plano implementa o dark mode **completo e auditável**, mantendo a identidade arcade.

## Diagnóstico (já feito)

| # | Problema | Localização | Severidade |
|---|---|---|---|
| 1 | Botão do ThemeSwitcher comentado | `src/components/ThemeSwitcher.tsx:65-78` | 🔴 Bloqueia toggle |
| 2 | AntdProvider com tema fixo (sem `darkAlgorithm`) | `src/providers/AntdProvider.tsx` | 🔴 Componentes antd em light |
| 3 | 261 cores hardcoded em 11 CSS Modules | vários `*.module.css` | 🔴 Cards ficam brancos |
| 4 | Validação WCAG ausente | — | 🟡 Risco de contraste insuficiente |

### Top 3 arquivos a corrigir (Fase 3 — críticos)

| Arquivo | Cores hardcoded | Tela |
|---|---|---|
| `src/app/battle/BattlePage.module.css` | 77 | Demo principal — bola, log, campo |
| `src/app/ranking/ranking.module.css` | 57 | Dashboard, ranking, troféus |
| `src/app/game/MarketPage.module.css` | 55 | Mercado, drag-and-drop |

### Arquivos médios (Fase 4)

`page.module.css` (19), `profile.module.css` (11), `AthleteMarketItem.module.css` (12), `ProfileCorner.module.css` (10), `register.module.css` (8), `login.module.css` (7), `LanguageSwitcher.module.css` (3), `ThemeSwitcher.module.css` (2).

## CSS Variables disponíveis

Definidas em [`src/app/globals.css`](../src/app/globals.css). Light em `:root` (linha 1), dark em `:root[data-theme="dark"]` (linha 60).

### Vars que MUDAM no dark mode

| Variável | Light | Dark | Quando usar |
|---|---|---|---|
| `--bg-page` | `#f9fafb` | `#0a0a0a` | Fundo da página |
| `--bg-surface` | `#ffffff` | `#1a1a1a` | Headers, surface neutra |
| `--bg-muted` | `#f3f4f6` | `#111827` | Áreas secundárias |
| `--bg-card` | `#ffffff` | `#1f2937` | Cards, painéis |
| `--bg-input` | `#d9d9d9` | `#1f2937` | Inputs em estado normal |
| `--bg-input-focus` | `#ebebeb` | `#273244` | Inputs em foco |
| `--border` | `#e5e7eb` | `#1f2937` | Bordas suaves |
| `--border-strong` | `#d1d5db` | `#334155` | Bordas fortes |
| `--border-arcade` | `#1f2937` | `#f8fafc` | Borda arcade dos botões |
| `--text-strong` | `#111827` | `#f8fafc` | Títulos, texto principal |
| `--text-body` | `#374151` | `#e2e8f0` | Corpo de texto |
| `--text-muted` | `#6b7280` | `#94a3b8` | Texto secundário |
| `--text-faint` | `#9ca3af` | `#64748b` | Texto desbotado |
| `--text-on-card` | `#111827` | `#f8fafc` | Texto sobre card |

### Vars que NÃO mudam (identidade arcade)

`--brand-primary` (laranja `#f97316`), `--wood-*` (madeira dos botões), `--sky-blue`, `--grass-green` — **mantém igual** em ambos os temas. Cores do jogo (campo verde, bola branca, marcações) também são identidade visual.

## Fases de execução

### 🔧 Fase 1 — Reativar botão ThemeSwitcher (5 min)

**Bloqueia o demo de terça — fazer PRIMEIRO.**

**Arquivo:** `src/components/ThemeSwitcher.tsx`

**Linhas 65-78 (estado atual):**
```tsx
return (
  // <button
  //   type="button"
  //   className={styles.button}
  //   onClick={handleClick}
  //   aria-label={`${t("label")}: ${label}`}
  // >
  //   <span className={styles.icon} aria-hidden="true">
  //     {target === "dark" ? <MoonOutlined /> : <SunOutlined />}
  //   </span>
  //   {label}
  // </button>
  <></>
);
```

**Substituir por:**
```tsx
return (
  <button
    type="button"
    className={styles.button}
    onClick={handleClick}
    aria-label={`${t("label")}: ${label}`}
  >
    <span className={styles.icon} aria-hidden="true">
      {target === "dark" ? <MoonOutlined /> : <SunOutlined />}
    </span>
    {label}
  </button>
);
```

**Validação:**
```bash
cd front
npm run test src/components/ThemeSwitcher.test.tsx
npm run dev  # checar visualmente que toggle aparece no ProfileCorner
```

**DoD:** botão aparece no header, click alterna tema, cookie `NEXT_THEME` persiste no DevTools → Application → Cookies.

---

### ⚙️ Fase 2 — Antd com darkAlgorithm dinâmico (30 min)

**Arquivo:** `src/providers/AntdProvider.tsx`

**Substituir o arquivo inteiro por:**

```tsx
"use client";

import { ConfigProvider, App as AntdApp, theme as antdTheme } from "antd";
import { useEffect, useState, type ReactNode } from "react";

import { defaultTheme, type Theme } from "@/lib/theme";

const sharedToken = {
  colorPrimary: "#f97316",
  colorPrimaryHover: "#ea580c",
  colorPrimaryActive: "#c2410c",
  colorLink: "#c2410c",
  colorLinkHover: "#f97316",
  borderRadius: 12,
  fontFamily:
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const darkToken = {
  colorBgContainer: "#1f2937",
  colorBgElevated: "#1a1a1a",
  colorBgLayout: "#0a0a0a",
  colorBorder: "#334155",
  colorText: "#f8fafc",
  colorTextSecondary: "#e2e8f0",
  colorTextTertiary: "#94a3b8",
};

const buttonComponent = {
  Button: {
    controlHeight: 44,
    controlHeightLG: 56,
    fontWeight: 700,
    primaryShadow: "0 4px 0 #b45309",
  },
};

export default function AntdProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Estado inicial vindo do SSR
    const initial = document.documentElement.dataset.theme as Theme | undefined;
    if (initial === "light" || initial === "dark") {
      setCurrentTheme(initial);
    }

    // Observa mudanças do ThemeSwitcher
    const observer = new MutationObserver(() => {
      const next = document.documentElement.dataset.theme as Theme | undefined;
      if (next === "light" || next === "dark") {
        setCurrentTheme(next);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const isDark = currentTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          ...sharedToken,
          ...(isDark ? darkToken : {}),
        },
        components: buttonComponent,
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
```

**Validação:**
```bash
npm run dev
# Abrir http://localhost:3000, clicar toggle, conferir:
# - Modal do antd (se houver) muda fundo
# - Input/Select/DatePicker mudam fundo e texto
# - Notification/Message muda fundo
```

**DoD:** componentes antd respeitam o tema; observer reage ao toggle sem refresh.

---

### 🎨 Fase 3 — Trocar cores hardcoded nos 3 arquivos críticos (~2h)

**Faça arquivo por arquivo, na ordem:** `BattlePage` → `ranking` → `MarketPage`.

**Para cada arquivo:**

1. Abrir o `.module.css`
2. Listar todas cores hardcoded:
   ```bash
   grep -n "#[0-9a-fA-F]\{3,6\}\|rgb(\|rgba(" src/app/<rota>/<arquivo>.module.css
   ```
3. Para cada linha, aplicar a **tabela de decisão abaixo**
4. Após o arquivo terminado, validar no browser (light + dark)

#### Tabela de decisão de substituição

| Cor hardcoded | Contexto típico | Substituir por | Quando MANTER |
|---|---|---|---|
| `#ffffff`, `#fff` | `background` de card/painel | `var(--bg-card)` | Se for fundo do campo de futebol ou bola |
| `#ffffff`, `#fff` | `color` em texto sobre laranja/verde | manter | Texto sobre cores de marca |
| `#f8fafc`, `#f1f5f9` | fundo claro | `var(--bg-surface)` | — |
| `#111827`, `#1f2937` | `color` em texto | `var(--text-strong)` | Se for `var(--border-arcade)` |
| `#111827`, `#1f2937` | `background` muito escuro | `var(--bg-card)` (vira escuro mais claro no dark) | Identidade fixa |
| `#374151`, `#4b5563` | `color` em texto | `var(--text-body)` | — |
| `#6b7280`, `#9ca3af` | `color` em texto secundário | `var(--text-muted)` | — |
| `#e5e7eb`, `#d1d5db` | `border` | `var(--border)` ou `var(--border-strong)` | — |
| `#dc2626`, `#ef4444` | erro | `var(--error)` | — |
| `#16a34a`, `#22c55e` | sucesso | `var(--success)` | — |
| `rgba(0, 0, 0, 0.X)` | `box-shadow` ou overlay | **MANTER** | Sombras pretas funcionam em ambos os temas |
| `rgba(255, 255, 255, 0.X)` | overlay sobre escuro | **MANTER** | Mantém efeito no campo de futebol |
| `#2e7d32`, `#338538`, `#176b3a` | gradiente do campo verde | **MANTER** | Identidade do campo de futebol |
| `#7ec8e3` | azul céu | **MANTER** | Identidade visual |
| `#f97316`, `#ea580c`, `#c2410c` | laranja arcade | `var(--brand-primary)` ou similar | Já é a brand color |
| `#fbbf24`, `#a16207` | dourado (troféus) | **MANTER** | Cor do troféu sempre dourada |
| `#fee2e2`, `#dcfce7` | background de erro/sucesso | `var(--error-bg)` / `var(--success-bg)` | — |

#### Exemplo concreto — antes/depois

**Antes** (`BattlePage.module.css:45-49`):
```css
.card {
  background: #ffffff;
  color: #111827;
  border: 4px solid #1f2937;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25);
}
```

**Depois:**
```css
.card {
  background: var(--bg-card);
  color: var(--text-strong);
  border: 4px solid var(--border-arcade);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25); /* mantém — sombra preta OK nos dois */
}
```

#### Validação obrigatória após cada arquivo

```bash
npm run dev
```

Abrir a rota correspondente (`/battle`, `/ranking`, `/game`), clicar no toggle, conferir visualmente:

- [ ] Tela inteira muda fundo
- [ ] Textos legíveis (contraste razoável a olho)
- [ ] Bordas continuam visíveis
- [ ] Identidade arcade (laranja, campo verde) preservada
- [ ] Sem áreas "ilhadas" brancas em meio ao dark

---

### 🎨 Fase 4 — Cores hardcoded nos 5 arquivos médios (~1h)

**Mesma lógica da Fase 3**, aplicada a:

1. `src/app/page.module.css` (19 cores) — home
2. `src/app/profile/profile.module.css` (11)
3. `src/components/AthleteMarketItem.module.css` (12)
4. `src/components/ProfileCorner.module.css` (10)
5. `src/app/auth/register/register.module.css` (8)
6. `src/app/auth/login/login.module.css` (7)
7. `src/components/LanguageSwitcher.module.css` (3)
8. `src/components/ThemeSwitcher.module.css` (2)

Para cada um, validar visualmente na rota correspondente.

---

### ✅ Fase 5 — Validação WCAG + testes (~30 min)

#### Validação visual

```bash
npm run dev
```

Abrir cada rota nos **dois temas** e marcar o checklist:

- [ ] `/` (home)
- [ ] `/auth/login`
- [ ] `/auth/register`
- [ ] `/game` (mercado + time)
- [ ] `/battle` (jogar rodada com animação)
- [ ] `/ranking` (dashboard + lista)
- [ ] `/profile`

#### Auditoria WCAG (Chrome Lighthouse)

1. Abrir cada rota em dark
2. Chrome DevTools → Lighthouse → categoria "Accessibility"
3. Run audit
4. Score >= 90 e zero issues de contraste = OK
5. Se houver issue de contraste, ajustar a variable em `globals.css` (não mexer no CSS Module)

#### Adicionar 1 teste E2E mínimo

**Arquivo:** `src/components/ThemeSwitcher.test.tsx`

Adicionar caso de teste:
```tsx
it("aplica o tema selecionado no html data-theme", async () => {
  renderWithProviders(<ThemeSwitcher initialTheme="light" />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button"));
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  expect(document.cookie).toContain("NEXT_THEME=dark");
});
```

#### Suite completa

```bash
npm run test
npm run lint
npx tsc --noEmit
```

Tudo verde = pronto pra mergear.

---

## Comandos úteis

```bash
# Contar cores hardcoded restantes em um arquivo
grep -c "#[0-9a-fA-F]\{3,6\}\|rgb(\|rgba(" src/app/battle/BattlePage.module.css

# Contar uso de var(--*) em um arquivo
grep -c "var(--" src/app/battle/BattlePage.module.css

# Lista TODAS cores hardcoded com linha
grep -rn "#[0-9a-fA-F]\{3,6\}\|rgb(\|rgba(" src --include="*.module.css"

# Roda dev
npm run dev

# Roda testes específicos
npm run test src/components/ThemeSwitcher.test.tsx

# Validação completa antes de mergear
npm run lint && npx tsc --noEmit && npm run test && npm run i18n:check
```

## Critério de pronto (DoD)

- [x] Fase 1 — botão visível, toggle funciona, cookie persiste
- [x] Fase 2 — componentes antd respeitam o tema (Button, Input, Modal, Notification)
- [x] Fase 3 — BattlePage, ranking, MarketPage 100% dark-mode aware
- [x] Fase 4 — 5 arquivos médios 100% dark-mode aware
- [x] Fase 5 — Lighthouse a11y >= 90 em todas as rotas em dark, teste E2E passando
- [x] `npm run test`, `npm run lint`, `npx tsc --noEmit` todos verdes
- [x] Identidade arcade preservada (laranja, campo verde, troféu dourado mantidos hardcoded)

## Riscos e armadilhas

1. **Antd 6 + darkAlgorithm:** o algoritmo dark do antd ajusta automaticamente cores neutras dos componentes — sobrescrevemos só o essencial em `darkToken` pra evitar conflito com nossas CSS vars.
2. **MutationObserver pode disparar excesso:** filtra com `attributeFilter: ["data-theme"]` (já está no snippet).
3. **Bola/campo/troféu:** SE substituir, perde a identidade visual. **Manter hardcoded** as cores do domínio do jogo.
4. **CSS Modules têm escopo:** uma substituição num arquivo NÃO afeta outro — confirme que cobriu todos.
5. **Server Components não veem `useEffect`:** se algum SSR estiver mostrando o tema errado por 1 frame, é porque o componente é Server e o `<html data-theme>` chega correto do servidor. Não é bug.

## Pós-implementação

Após mergear, atualizar:

- `front/docs/ARQUITETURA_FRONT.md` seção "Dark Mode" — descrever o `MutationObserver` no AntdProvider
- `front/docs/DEFESA_FRONT.md` — pergunta 2 ganha um detalhe: "componentes antd respeitam o tema via observer no AntdProvider que muda `theme.algorithm` em runtime"
- Print de antes/depois em `apresentacao/screenshots/dark-mode-before-after.png` (pra usar na defesa se a banca perguntar)
