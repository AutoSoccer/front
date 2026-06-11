import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      // O lcov.info precisa de paths RELATIVOS ao repo root para o SonarCloud
      // conseguir casar contra `sonar.sources=src`. Sem `projectRoot: './'` o
      // provider v8 grava caminhos absolutos do runner CI (/home/runner/...)
      // e a cobertura no Sonar cai em 0%.
      reporter: ["text", "html", "json-summary", ["lcov", { projectRoot: "./" }]],
      // src/app/** excluido temporariamente — pages Next.js sem cobertura
      // ainda; sera incluido quando testes E2E forem adicionados (follow-up).
      include: [
        "src/components/**/*.{ts,tsx}",
        "src/context/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/providers/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/__tests__/**",
        "src/i18n/**",
        "src/types/**",
      ],
      thresholds: { lines: 50, branches: 40, functions: 50 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
