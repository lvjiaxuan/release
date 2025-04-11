import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/test/fixtures/**', '**/dist/**'],
  },
  server: {
    watch: {
      ignored: ['**/test/fixtures/**', '**/dist/**'],
    },
  },
})
