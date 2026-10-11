import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', restoreMocks: true, clearMocks: true },
  build: { target: 'es2022', modulePreload: false, emptyOutDir: true },
});
