const { Socket, Io } = require('schemahandler/io/io')
const orm = require('schemahandler/orm')
const Hooks = require('schemahandler/hooks/hooks')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')

function cmsFactory(testName) {
  orm.connect({uri: "mongodb://localhost:27017"}, testName);
  const socketToFrontend = new Io()
  socketToFrontend.listen('frontend')
  const cms = {
    init: async function () {
      await this.initDemoData()
    },
    initDemoData: async function () {
      const dataPath = path.resolve(__dirname, './dataMock/demoData.json')
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

      for (const collection in data) {
        await cms.getModel(collection).remove({})
        if (data.hasOwnProperty(collection)) {
          await Promise.all(data[collection].map(async document => {
            await cms.getModel(collection).create(document)
          }))
        }
      }
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
