module.exports = {
  verbose: true,

  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src'],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },

  transformIgnorePatterns: [
    "/node_modules/(?!normalize-url/|unified/|bail/|is-plain-obj/|trough/|vfile/|vfile-message/|unist-util-stringify-position/|remark-parse/|mdast-util-from-markdown/|mdast-util-to-string/|micromark.*/|decode-named-character-reference/|character-entities/)",
  ],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
