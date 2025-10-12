import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
        globals: {
          console: 'readonly',
          process: 'readonly',
          Buffer: 'readonly',
          __dirname: 'readonly',
          __filename: 'readonly',
          module: 'readonly',
          require: 'readonly',
          exports: 'readonly',
          global: 'readonly',
          window: 'readonly',
          document: 'readonly',
          navigator: 'readonly',
          localStorage: 'readonly',
          sessionStorage: 'readonly',
          HTMLElement: 'readonly',
          MouseEvent: 'readonly',
          KeyboardEvent: 'readonly',
          Node: 'readonly',
          setTimeout: 'readonly',
          confirm: 'readonly',
        },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allow console for debugging
    },
  },
  {
    ignores: [
      'node_modules/**',
      'lib/**',
      'dist/**',
      'coverage/**',
      '*.js',
      '*.mjs',
      'test/**',
    ],
  },
];