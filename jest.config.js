const { defaults } = require('jest-config')
const { argv } = require('yargs')

module.exports = {
  verbose: true,
  preset: defaults.preset,
  moduleFileExtensions: ['vue', 'js', 'json'],
  transform: {
    '^.*\\.vue$': "vue-jest",
    '^.+\\.js$': "<rootDir>/node_modules/babel-jest",
  },
  "snapshotSerializers": ["jest-serializer-html"],
  setupFiles: ['./jest.setup.js']
}
