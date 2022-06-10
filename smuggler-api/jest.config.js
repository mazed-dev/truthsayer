export default {
  verbose: true,

  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },

  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // modulePaths: ['<rootDir>/../armoury/dist'],
  // moduleDirectories: ['node_modules', 'armoury'],

  // transformIgnorePatterns: ['/node_modules/(?!normalize-url/)'],
  // transformIgnorePatterns: ['node_modules/(?!armoury)'],

  // Runs special logic, such as cleaning up components
  // when using React Testing Library and adds special
  // extended assertions to Jest
  // setupFilesAfterEnv: [
  //   "@testing-library/react/cleanup-after-each",
  //   "@testing-library/jest-dom/extend-expect"
  // ],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  // preset: 'ts-jest/presets/default-legacy',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'mjs', 'js', 'json', 'node'],

  // If you'd like to know what the below regex does, see comment to
  // 'moduleNameMapper' section of armoury/jest.config.js for more information
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  modulePaths: [
    '<rootDir>/armoury',
    '<rootDir>/../../armoury',
    '<rootDir>/../armoury',
    '<rootDir>/../',
  ],
}
