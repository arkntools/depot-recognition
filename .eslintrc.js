const offTsRules = [
  'strict-boolean-expressions',
  'prefer-nullish-coalescing',
  'no-non-null-assertion',
  'promise-function-async',
  'explicit-function-return-type',
  'no-floating-promises',
  'no-misused-promises',
  'restrict-plus-operands',
  'no-explicit-any',
  'no-empty-function',
  'no-confusing-void-expression',
];

module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'standard-with-typescript',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  rules: {
    ...Object.fromEntries(offTsRules.map(name => [`@typescript-eslint/${name}`, 'off'])),
    '@typescript-eslint/consistent-type-imports': ['warn', { disallowTypeAnnotations: false }],
    'import/order': 'warn',
  },
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
