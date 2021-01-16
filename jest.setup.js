//orm.connect("mongodb://localhost:27017", "roomTest");

jest.mock('cms', () => {
  const orm = require('schemahandler');
  const {Socket} = require('schemahandler/io/io')
  return {
    getModel(col) {
      return orm(col)
    },
    socket: new Socket()
  }
})
