import path from 'path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/sofi-anki/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'sofi-anki',
        short_name: 'sofi-anki',
        description: 'Personal flashcard study app',
        theme_color: '#622f47',
        background_color: '#fdf2f3',
        display: 'standalone',
        start_url: '/sofi-anki/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm}'],
        // A megabyte and more of diagram code nobody needs until a card holds a diagram.
        globIgnores: ['**/diagram-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/diagram-[\w-]+\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'diagram', expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // Above Mermaid's largest chunk, which loads only for a diagram. scripts/chunk-sizes.mjs
    // holds every other chunk to Vite's 500 kB.
    chunkSizeWarningLimit: 1700,
    rolldownOptions: {
      output: {
        // Libraries apart from the app, so each chunk stays under the 500 kB warning and a
        // release that changes only the app leaves them cached.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'markdown', test: /node_modules[\\/](react-markdown|remark-|rehype-|micromark|mdast-|unified|hast-|vfile|property-information)/ },
            { name: 'math', test: /node_modules[\\/]katex[\\/]/ },
            { name: 'anki-file', test: /node_modules[\\/](sql\.js|turndown|fzstd|marked)[\\/]/ },
            // Mermaid and its libraries, imported only when a card holds a diagram: kept apart from
            // the eager vendor chunk, split under the warning, and cached on first use (below).
            {
              name: 'diagram',
              test: /node_modules[\\/](mermaid|@mermaid-js|@braintree|@iconify|@upsetjs|chevrotain|langium|vscode-|cytoscape|cose-base|layout-base|d3|internmap|delaunator|robust-predicates|dagre-d3-es|dayjs|dompurify|elkjs|es-toolkit|lodash-es|khroma|roughjs|stylis|ts-dedent)/,
              maxSize: 450_000,
            },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
