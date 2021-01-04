const orm = require('schemahandler');
orm.connect('mongodb://localhost:27017', 'tseDb');
const Hooks = require('schemahandler/hooks/hooks');
const cms = new Hooks();
const _ = require('lodash');
const _cms = {
  getModel(collection) {
    return orm(collection);
  }
}

_.extend(cms, _cms);

const tsePlugin = require('./tse');

beforeAll(async () => {
  await tsePlugin(cms);
}, 20000)

it('case 1 run:print', async function (done) {
  const commit = {
    order: {

    }
  }

  cms.emit('run:print', commit);
}, 80000);
