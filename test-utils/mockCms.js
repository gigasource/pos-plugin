import {demoData as data} from "../components2/OrderView/__test__/demoData";

const { Socket, Io } = require('schemahandler/io/io')
//const Orm = require('schemahandler/orm')
const orm = require('schemahandler')
const Hooks = require('schemahandler/hooks/hooks')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')

function cmsFactory(testName) {
  let _orm
  if (process.env.USE_GLOBAL_ORM) {
    _orm = orm;
  } else {
    _orm = new orm();
  }
  //const orm = new Orm()
  //orm.name = testName
  _orm.connect({uri: "mongodb://localhost:27017"}, testName);
  const socketToFrontend = new Io()
  socketToFrontend.listen(`frontend:${testName}`)
  const feSocket = new Socket()
  const cms = {
    init: async function () {
      await this.initDemoData()
    },
    initDemoData: async function () {
      const dataPath = path.resolve(__dirname, './dataMock/demoData.json')

      for (const collection in data) {
        await cms.getModel(collection).remove({})
        if (data.hasOwnProperty(collection)) {
          await Promise.all(data[collection].map(async document => {
            await cms.getModel(collection).create(document)
          }))
        }
      }
    },
    orm: _orm,
    socket: socketToFrontend,
    getModel: function (modelName) {
      return _orm(modelName)
    },
    feSocket,
    triggerFeConnect: function () {
      feSocket.connect(`frontend:${testName}`)
    },
    Types: {}
  }
  _.extend(cms, new Hooks())
  return cms
}

module.exports = cmsFactory
