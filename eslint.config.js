import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import nPlugin from 'eslint-plugin-n'
import promisePlugin from 'eslint-plugin-promise'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'release/**',
      'core/test/**',
      'core/release/**'
    ]
  },

  // ESLint 標準ルール
  js.configs.recommended,
  // TypeScript ESLintルール
  ...tseslint.configs.recommended,

  // standard 相当ルール
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.mts'],

    plugins: {
      import: importPlugin,
      n: nPlugin,
      promise: promisePlugin,
    },

    rules: {
      // standard の核
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',

      // 見た目・癖
      indent: ['error', 2],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'space-before-function-paren': ['error', 'never'],

      // 実務向け緩和
      'no-unused-vars': ['warn'],

      // standard系プラグイン
      'import/order': 'warn',
      'n/no-deprecated-api': 'warn',
      'promise/always-return': 'off',
    },
  },

  //
  {
    files: ['**/*.ts', '**/*.mts'],
    rules: {
        // anyに関するルールを無効化
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        // promiseに関するルールを無効化
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/require-await": "off",
        //
        "@typescript-eslint/ban-ts-comment": "off",
        "quote-props": "off",
        "no-unused-vars": "off",
        "no-undef": "off",
        "@typescript-eslint/no-unused-vars":  "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-function": "off",
        "react/prop-types": "off"
    },
  }
]
