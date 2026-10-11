import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  { files: ['public/probe/*.js'], languageOptions: { globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly', URL: 'readonly' } } },
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
);
