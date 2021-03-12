import { nextTick } from 'vue'
import { wrapper, makeWrapper } from "../../test-utils";
import delay from "delay"
import { onlineOrdersList, filter } from "../online-order-list-render";

require("mockdate").set(new Date("2021-01-14").getTime());

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
import OnlineOrderList from '../OnlineOrderList';
import {getOnlineOrdersByLimit} from "../online-order-main-logic-be";
import dayjs from "dayjs";

//todo: mock new i18n
describe("Test online order list", () => {
  beforeAll(async () => {
    await cms.initDemoData()
    await prepareOnlineOrderDb(cms.orm)
    onlineOrdersList.value = await getOnlineOrdersByLimit(0, 50)
    filter.value.fromDate = dayjs().format('YYYY-MM-DD')
    filter.value.toDate = dayjs().format('YYYY-MM-DD')
    cms.triggerFeConnect()
  })
  it("should render", async () => {
    makeWrapper(OnlineOrderList);
    await nextTick()
    await delay(60)
    expect(wrapper.html()).toMatchSnapshot();
  });
});
