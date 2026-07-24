import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'e2e/**', 'test-results/**', 'playwright-report/**'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/lib/cli-diagnostic.ts',
        'src/lib/diagnostic-types.ts',
        'src/lib/diagnostic-target.ts',
        'src/lib/rate-limit.ts',
        'src/lib/validators.ts',
        'src/app/[lang]/tools/website-check/_hooks/helpers.ts',
        'src/app/[lang]/tools/website-check/_lib/report.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
