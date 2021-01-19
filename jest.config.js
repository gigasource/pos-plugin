const {defaults} = require('jest-config')
const {argv} = require('yargs')

module.exports = {
  verbose: true,
  preset: defaults.preset,
  moduleFileExtensions: ['vue', 'js', 'json'],
  //testEnvironment: argv.testNamePattern.includes('dom') ? 'jsdom' : "node",
  transform: {
    '^.*\\.vue$': "vue-jest",
    '^.+\\.js$': "<rootDir>/node_modules/babel-jest",
    ".+\\.(css|styl|less|sass|scss|png|jpg|svg|ttf|woff|woff2)$": "<rootDir>/node_modules/jest-transform-stub"
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!pos-vue-framework)",
  ],
  moduleNameMapper: {
    "vue-router": "<rootDir>/../../backoffice/node_modules/vue-router",
    "vue-i18n":"<rootDir>/../../backoffice/node_modules/vue-i18n",
    "portal-vue":"<rootDir>/../../backoffice/node_modules/portal-vue",
  },
  snapshotSerializers: ["jest-serializer-html"],
  //todo: remove setupFiles
  setupFiles: ['./jest.setup.js'],
}
