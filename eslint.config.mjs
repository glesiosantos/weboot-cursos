import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'curly': ['error', 'all'],
    'eqeqeq': ['error', 'always'],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@stylistic/max-statements-per-line': 'off',
  },
})
