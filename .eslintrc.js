module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parser: '@babel/eslint-parser',
  rules: {
    curly: ['error', 'multi-line'],
  },
  overrides: [
    {
      files: ['**/*.spec.js', '**/*.jm.js'],
      env: {
        jest: true,
      },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
    {
      files: ['**/*.jm.js'],
      rules: {
        'jest/no-export': 'off',
      },
    },
  ],
};
