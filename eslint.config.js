'use strict';

const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'eqeqeq': 'error',
      'no-console': 'off',
    },
  },
];
