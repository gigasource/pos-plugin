const { Socket, Io } = require('schemahandler/io/io')
const orm = require('schemahandler/orm')

function cmsFactory(testName) {
  orm.connect({uri: "mongodb://localhost:27017"}, testName);
  const socketToFrontend = new Io()
  socketToFrontend.listen('frontend')
  const cms = {
    orm,
    socketToFrontend
  }
  return cms
}

module.exports = cmsFactory
