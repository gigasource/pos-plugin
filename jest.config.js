const { defaults } = require('jest-config')
const { argv } = require('yargs')

module.exports = {
  verbose: true,
  preset: defaults.preset,
  moduleFileExtensions: ['vue', 'js', 'json'],
  transform: {
    '^.*\\.vue$': "vue-jest",
    '^.+\\.js$': "<rootDir>/node_modules/babel-jest",
    ".+\\.(css|styl|less|sass|scss|png|jpg|svg|ttf|woff|woff2)$": "<rootDir>/node_modules/jest-transform-stub"
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!pos-vue-framework)",
  ],
  snapshotSerializers: ["jest-serializer-html"],
  //todo: remove setupFiles
  setupFiles: ['./jest.setup.js'],
}
