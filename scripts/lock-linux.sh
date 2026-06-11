#!/usr/bin/env bash
# Regenera package-lock.json com todos os bindings nativos opcionais
# necessarios para Linux (CI + Vercel + Railway).
#
# CONTEXTO — bug npm/cli#4828:
# Vitest 4 usa rolldown, que tem bindings nativos por plataforma como
# optionalDependencies. Quando o package-lock.json e regenerado em macOS
# darwin/arm64, o npm poda as optional deps de outras plataformas. Resultado:
# `npm ci` falha no Ubuntu/GitHub Actions/Vercel/Railway com:
#   Error: Cannot find module '@rolldown/binding-linux-x64-gnu'
#
# Mesma classe de bug afeta: lightningcss, @tailwindcss/oxide, @rollup/rollup.
# Issue oficial: https://github.com/npm/cli/issues/4828
#
# USO:
#   npm run lock:linux        # roda este script via Docker
#
# REQUER: Docker Desktop instalado e rodando.
#
# RESULTADO: package-lock.json com entries para TODAS as plataformas
# suportadas — funciona em Mac (npm respeita os/cpu e pula entries Linux),
# em Linux (CI/Vercel/Railway encontra as entries que precisa), e em
# Windows. Apos rodar, faca commit do lockfile e rode `npm install`
# localmente para reinstalar com bindings darwin.

set -euo pipefail

if ! command -v docker &> /dev/null; then
  echo "ERRO: docker nao encontrado. Instale Docker Desktop primeiro." >&2
  echo "Alternativa: rode em CI rapido (Actions) ou em um colega com Linux." >&2
  exit 1
fi

echo "→ Regenerando package-lock.json dentro de container Linux node:20..."
docker run --rm \
  -v "$PWD":/app \
  -w /app \
  node:20-bookworm \
  bash -c "rm -rf node_modules package-lock.json && npm install --include=optional --no-audit --no-fund"

echo ""
echo "✓ package-lock.json regenerado com bindings de todas as plataformas."
echo ""
echo "PROXIMOS PASSOS:"
echo "  1. git diff package-lock.json   # ver as entries linux/win adicionadas"
echo "  2. npm install                  # reinstalar node_modules com bindings darwin"
echo "  3. git add package-lock.json && git commit -m 'chore: regenera lockfile'"
