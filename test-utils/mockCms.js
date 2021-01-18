const { Socket, Io } = require('schemahandler/io/io')
const orm = require('schemahandler/orm')
const Hooks = require('schemahandler/hooks/hooks')
const _ = require('lodash')

function cmsFactory(testName) {
  orm.connect({uri: "mongodb://localhost:27017"}, testName);
  const socketToFrontend = new Io()
  socketToFrontend.listen('frontend')
  const cms = {
    orm,
    socket: socketToFrontend
  }
  _.extend(cms, new Hooks())
  return cms
}

module.exports = cmsFactory
