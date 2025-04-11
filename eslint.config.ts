import a from '@antfu/eslint-config'

export default a({
  typescript: {
    tsconfigPath: './tsconfig.json',
    overridesTypeAware: {
      'ts/strict-boolean-expressions': [
        'error',
        {
          allowNullableString: true,
          allowNullableEnum: true,
          allowNullableBoolean: true,
        },
      ],
    },
  },
}, {
  rules: {
    'no-console': 'off',
  },
})
