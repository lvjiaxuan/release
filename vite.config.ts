import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watchExclude: ['**/test/fixtures/**', '**/dist/**'],
  },
})
