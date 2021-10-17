/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset                : 'ts-jest',
  roots                 : ['<rootDir>/src'],
  testEnvironment       : 'node',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/'],
  testMatch             : ['**/test/**/*.spec.ts'],
  collectCoverage       : true,
  coverageThreshold     : {
    global: {
      branches  : 80,
      functions : 80,
      lines     : 80,
      statements: 80,
    },
  },
}
