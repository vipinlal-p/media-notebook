const js = require('@eslint/js')
const globals = require('globals')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')
const tseslint = require('typescript-eslint')

module.exports = tseslint.config(
  {
    ignores: ['frontend/dist/**', 'backend/dist/**', 'node_modules/**', 'release/**', '*.cjs', 'eslint.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['frontend/**/*.{ts,tsx}', 'shared/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['backend/**/*.ts', 'frontend/vite.config.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
)
