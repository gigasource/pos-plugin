const { defaults } = require('jest-config')
const { argv } = require('yargs')

module.exports = {
  verbose: true,
  preset: defaults.preset,
  transform: {
    '^.*\\.vue$': "vue-jest",
    '^.+\\.js$': "<rootDir>/node_modules/babel-jest",
  }
}
