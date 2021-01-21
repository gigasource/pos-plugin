//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";

import {addProduct, getCurrentOrder, prepareOrder} from '../../OrderView/pos-logic-be';

addProduct

import {mockProduct} from "../../OrderView/__test__/mock_product";
import {mockOrder} from "../../OrderView/__test__/mock-order";
import Order2 from "../../OrderView/Order2";
import {orderLayout} from "../../OrderView/pos-ui-shared";
import {demoData} from "../../OrderView/__test__/demoData";
import PosOrderLayout2 from "../../OrderView/PosOrderLayout2";
import {isMobile} from "../../AppSharedStates";
import RestaurantRoom from "../BasicRoom/RestaurantRoom";

const { stringify } = require("schemahandler/utils");

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("../../OrderView/pos-logic");

const delay = require("delay");

//</editor-fold>

describe("order-view test", function() {
  beforeAll(async () => {
    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
    await orm("Room").remove({});
    await orm("Room").create(demoData.Room[0]);
  });

  it("case 1 room", async function() {
    //order have 1 sent item, add one item -> should display print,
    makeWrapper(RestaurantRoom, { shallow: true });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);


});
