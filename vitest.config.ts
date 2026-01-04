import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for DOM testing
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.js',
        '**/*.config.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'src/styles.css', // CSS files don't need coverage
        'src/popup.html', // HTML files don't need coverage
        'src/popup.css', // CSS files don't need coverage
        'src/content.ts', // Integration code - tested manually on real GitHub
      ],
      include: [
        'src/validator.ts',
        'src/dom.ts',
        'src/popup.js',
        'src/context-menu.js',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
