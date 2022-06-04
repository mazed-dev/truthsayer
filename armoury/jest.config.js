export default {
  verbose: true,

  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'mjs', 'js', 'json', 'node'],
  // Below allows to make relative path imports within test files
  // to follow ESM style.
  // ESM imports have to specify a file extension, e.g.
  //    import * from './mymodule.js'
  // However jest/ts-jest v28 can't handle that and can only work with
  // CommonJS-style imports like
  //    import * from './mymodule'
  // To keep import style the same between prod and test code, the below
  // mapping is used.
  // See https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
  // for more details
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
