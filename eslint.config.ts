import lv from '@lvjiaxuan/eslint-config'

export default lv({
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
