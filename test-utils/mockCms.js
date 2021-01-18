const { Socket, Io } = require('schemahandler/io/io')
const orm = require('schemahandler/orm')
const Hooks = require('schemahandler/hooks/hooks')
const _ = require('lodash')

const posSettingData = require('./dataMock/mockPosSetting.json')

function cmsFactory(testName) {
  orm.connect({uri: "mongodb://localhost:27017"}, testName);
  const socketToFrontend = new Io()
  socketToFrontend.listen('frontend')
  const cms = {
    init: async function () {
      await orm('PosSetting').remove({})
      await orm('PosSetting').create(posSettingData)
    },
    orm,
    socket: socketToFrontend,
    getModel: function (modelName) {
      return orm(modelName)
    }
  }
  _.extend(cms, new Hooks())
  return cms
}

module.exports = cmsFactory
