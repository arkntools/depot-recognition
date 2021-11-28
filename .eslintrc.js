const offTsRules = [
  'strict-boolean-expressions',
  'prefer-nullish-coalescing',
  'no-non-null-assertion',
  'promise-function-async',
  'explicit-function-return-type',
  'no-floating-promises',
  'no-misused-promises',
];

module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  extends: ['standard-ts', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // project: './tsconfig.eslint.json',
    createDefaultProgram: true,
  },
  rules: Object.fromEntries(offTsRules.map(name => [`@typescript-eslint/${name}`, 'off'])),
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.jm.ts'],
      env: {
        jest: true,
      },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
    {
      files: ['**/*.jm.ts'],
      rules: {
        'jest/no-export': 'off',
      },
    },
  ],
};
