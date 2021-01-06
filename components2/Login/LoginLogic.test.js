import { login } from './LoginLogic';
import { appHooks, user } from '../AppSharedStates';

const orm = require("schemahandler");
orm.connect('mongodb://localhost:27017', 'testDb1')

let PosUser = orm('PosUser')

async function prepareDb() {
  await PosUser.remove()
  await PosUser.create({
    name: 'admin',
    passcode: '1234',
    role: 'admin'
  })
}

describe('Login Logic tests', function () {
  beforeAll(async () => {
    window.cms = {
      getModel(model) {
        return orm(model)
      }
    }
    await prepareDb()
  }, 10000)

  it('should login admin user and call appHook:updateUser', async function () {
    appHooks.on('updateUser', function (value) {
      expect(value).toBeDefined()
    })
    const result = await login('1234')
    expect(result).toMatchInlineSnapshot('true')
  });
});
