module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      modules: true,
      experimentalObjectRestSpread: true,
    },
  },
  plugins: ['import', 'prettier'],
  rules: {
    // 'no-lone-blocks': 0,
    'no-unexpected-multiline': 'warn',
    eqeqeq: 'error',
    'no-shadow': 'off',
    'no-console': 'error',
    'default-case': 'error',
    'func-call-spacing': ['error', 'never'],
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'implicit-arrow-linebreak': ['error', 'beside'],
    indent: ['warn', 2, { SwitchCase: 1 }],
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'never',
        exports: 'never',
        functions: 'never',
      },
    ],
    'block-spacing': ['error', 'always'],
    'brace-style': 'error',
    'prefer-template': 'error',
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/no-duplicates': 'error',
    'no-unused-vars': [
      'off',
      {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_$',
      },
    ],
    'prettier/prettier': ['off', {}, { usePrettierrc: true }],
  },
};
