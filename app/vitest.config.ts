import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Dedicated Vitest config (kept separate from vite.config.ts so the Tailwind
// plugin doesn't run during unit/integration tests). TEST_PLAN_V3 §1.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // spotify.ts reads import.meta.env.VITE_SPOTIFY_CLIENT_ID — give it a stable
    // value so PKCE tests are deterministic and never touch the real client id.
    env: { VITE_SPOTIFY_CLIENT_ID: 'test_client_id_123' },
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Pure-visual / entrypoint files carry no logic worth covering.
      exclude: [
        'src/main.tsx',
        'src/assets/**',
        'src/**/*.d.ts',
        'src/components/BrandMark.tsx',
      ],
    },
  },
})
