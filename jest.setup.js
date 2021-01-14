import orm from 'schemahandler'

//orm.connect("mongodb://localhost:27017", "roomTest");

const cms = {
  getModel(col) {
    return orm(col)
  }
}
jest.mock('cms', () => cms)
