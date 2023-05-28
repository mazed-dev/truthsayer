module.exports = {
  extends: ['./.eslintrc.js'],

  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
    // Majority of eslint validations do not need Typescript's type information
    // (even recommended typescript-eslint rules are separated into:
    //    - "plugin:@typescript-eslint/recommended"
    //    - "plugin:@typescript-eslint/recommended-requiring-type-checking")
    //
    // `project` & `tsconfigRootDir` config options below are required for
    // ones which require type information.
    // See https://typescript-eslint.io/linting/typed-linting/monorepos#one-tsconfigjson-per-package-and-an-optional-one-in-the-root
    // for more info.
    project: [
      './armoury/tsconfig.json',
      './elementary/tsconfig.json',
      './smuggler-api/tsconfig.json',
      './librarius/tsconfig.json',
      './truthsayer-archaeologist-communication/tsconfig.json',
      './text-information-retrieval/tsconfig.json',
      // At the time of writing the packages below have custom eslint configurations
      // './truthsayer/tsconfig.json',
      // './archaeologist/tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
  },
}
