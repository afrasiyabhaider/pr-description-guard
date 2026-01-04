import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.ts'),
        'context-menu': resolve(__dirname, 'src/context-menu.js'),
        popup: resolve(__dirname, 'src/popup.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup' || chunkInfo.name === 'context-menu') {
            return 'src/[name].js';
          }
          return '[name].js';
        },
      },
    },
    copyPublicDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    {
      name: 'copy-files',
      closeBundle() {
        // Copy CSS file
        copyFileSync(
          resolve(__dirname, 'src/styles.css'),
          resolve(__dirname, 'dist/styles.css')
        );
        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );
        // Create icons directory if it doesn't exist
        const iconsDir = resolve(__dirname, 'dist/icons');
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }
        // Copy icon files
        const iconSizes = [16, 48, 128];
        iconSizes.forEach(size => {
          copyFileSync(
            resolve(__dirname, `icons/icon${size}.png`),
            resolve(__dirname, `dist/icons/icon${size}.png`)
          );
        });
        // Create src directory for popup files
        const srcDir = resolve(__dirname, 'dist/src');
        if (!existsSync(srcDir)) {
          mkdirSync(srcDir, { recursive: true });
        }
        // Copy popup files
        copyFileSync(
          resolve(__dirname, 'src/popup.html'),
          resolve(__dirname, 'dist/src/popup.html')
        );
        copyFileSync(
          resolve(__dirname, 'src/popup.css'),
          resolve(__dirname, 'dist/src/popup.css')
        );
        // Copy context-menu.js (already built by Vite)
        // popup.js is also built by Vite
      },
    },
  ],
});
