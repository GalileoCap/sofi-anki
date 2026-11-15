import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import betterTailwind from 'eslint-plugin-better-tailwindcss'
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/api/defaults'

// The static design gate (T3 of docs/design-research.md). The rule ids name docs/design/rules.md.
const restricted = [
  { pattern: '-\\[(?:#|rgb|hsl|oklch|color|var\\(--color)', message: 'col-1: a colour comes from the tokens in src/index.css.' },
  { pattern: '^(?:[a-z-]+:)*text-\\[[\\d.]+(?:px|rem|em)\\]$', message: 'type-2: a type size comes from the scale in src/index.css.' },
  { pattern: '^(?:[a-z-]+:)*rounded(?:-[a-z]+)?-\\[', message: 'sp-3: a radius comes from the three in src/index.css.' },
  { pattern: '^(?:[a-z-]+:)*shadow-\\[', message: 'sp-4: a shadow is one of the two depths in src/index.css.' },
  { pattern: '^(?:[a-z-]+:)*(?:bg-(?:linear|radial|conic|gradient)-|from-|via-|to-)', message: 'col-9: no gradients.' },
  { pattern: '^(?:[a-z-]+:)*backdrop-blur', message: 'dec-4: no glass.' },
  { pattern: '^(?:[a-z-]+:)*transition-all$', message: 'mo-2: name what moves (transition-colors, transition-transform, transition-[width]).' },
  { pattern: '^(?:[a-z-]+:)*tracking-wid', message: 'copy-3: no eyebrow labels in tracked capitals.' },
]

export default defineConfig([
  globalIgnores(['dist', 'src/components/ui']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // CODE.md: a file has a length. Past it, the file is split at its seam.
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/**/*.tsx', 'src/lib/ui-looks.ts'],
    plugins: { 'better-tailwindcss': betterTailwind },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/index.css',
        selectors: [
          ...getDefaultSelectors(),
          // Class strings held in constants, found by the constant's name.
          {
            kind: 'variable',
            name: '^(?:looks|[A-Za-z_]*(?:[Ll]ook|[Cc]lass(?:Name)?|[Ss]tyle|STYLE|[Cc]olor|COLOR|LEVEL|[Ss]watch|[Dd]ot|[Cc]ell|[Rr]ow|[Ss]egment)S?s?)$',
            match: [{ type: 'strings' }, { type: 'objectValues' }],
          },
          { kind: 'variable', name: '.*', match: [{ type: 'objectValues', path: 'className$' }] },
        ],
      },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-restricted-classes': ['error', { restrict: restricted }],
    },
  },
])
