import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';

export default [
  {
    // dist, node_modules, generated files, and pages using <script define:vars>
    // (eslint-plugin-astro does not support the define:vars directive)
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'src/pages/compare.astro'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  ...astroPlugin.configs.recommended,
];