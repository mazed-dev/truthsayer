export default {
  verbose: true,

  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },

  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // transformIgnorePatterns: ['/node_modules/(?!normalize-url/)'],
  // transformIgnorePatterns: [],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'js', 'mjs', 'json', 'node'],
}
