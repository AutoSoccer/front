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
      reporter: ["text", "html", "lcov"],
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
