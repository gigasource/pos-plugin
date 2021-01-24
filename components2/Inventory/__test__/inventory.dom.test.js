import { makeWrapper, orm, wrapper } from '../../test-utils';
import {nextTick} from "vue";
import Inventory from '../Inventory'

const { prepareDb } = require('../../../backend/order-logic/report.prepare.test')

const delay = require("delay");

jest.mock('cms', () => {
  const { cmsFactory } = require('../../../test-utils')
  const _cms = cmsFactory('eodDom')
  global.cms = _cms
  return {
    socket: _cms.feSocket,
    getModel: function (modelName) {
      return _cms.orm(modelName)
    }
  }
})

let cms = global.cms

const {stringify} = require("schemahandler/utils");

describe('Test inventory screen', function () {
  beforeAll(async () => {
    await cms.initDemoData()
    await prepareDb(cms.orm)
    cms.triggerFeConnect()
  })

  it('Case 1: Inventory', async () => {
    makeWrapper(Inventory, {
      shallow: true,
      props: {
      }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  })
})

