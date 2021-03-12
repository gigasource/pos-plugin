import { nextTick } from 'vue'
import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderMain from "../OnlineOrderMain";
import delay from "delay";

require("mockdate").set(new Date("2021-01-05").getTime());

jest.setTimeout(60000);

jest.mock('cms', () => {
  const { cmsFactory } = require('../../../test-utils')
  const _cms = cmsFactory('inventoryDom')
  global.cms = _cms
  return {
    socket: _cms.feSocket,
    getModel: function (modelName) {
      return _cms.orm(modelName)
    }
  }
})

let cms = global.cms

const {
  prepareOnlineOrderDb
} = require('../../../backend/online-order/__test__/online-order.prepare.test')

describe("Test render online order", () => {
  beforeAll(async () => {
    await cms.initDemoData()
    await prepareOnlineOrderDb(cms.orm)
    cms.triggerFeConnect()
  })

  it("should render", async () => {
    makeWrapper(OnlineOrderMain, {
      shallow: false,
      props: {}
    });
    await nextTick()
    await delay(50)
    expect(wrapper.html()).toMatchSnapshot();
  });
});
