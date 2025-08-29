import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import { globalIgnores } from 'eslint/config'

// Flat config: base JS rules, then TypeScript overrides
export default [
  js.configs.recommended,
  // React hooks and refresh provide their recommended configs objects
  reactHooks.configs?.['recommended-latest'] || {},
  reactRefresh.configs?.vite || {},
  {
    ignores: globalIgnores(['dist']),
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: '@typescript-eslint/parser'
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // include the plugin recommended rules
      ...((tsPlugin.configs && tsPlugin.configs.recommended && tsPlugin.configs.recommended.rules) || {}),
    },
  },
]
