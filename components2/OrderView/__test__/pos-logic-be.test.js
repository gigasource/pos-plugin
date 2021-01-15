//<editor-fold desc="declare">
import "../../../jest.setup";
import { nextTick } from "vue";
import _ from "lodash";
import {
  addPayment,
  cancelOrder,
  changeCourse,
  clearPayment,
  removeItem,
  removeModifier,
  updateItem,
  hooks,
  simulateBackendPrint,
  changeItemQuantity
} from "../pos-logic";
import {
  actionList,
  addProduct,
  currentTable,
  disablePay,
  getCurrentOrder,
  itemQuantityChangeCheck,
  onlyCheckoutPrintedItems,
  payBtnClickable,
  payPrintMode,
  prepareOrder,
  quickBtnAction,
  showIcon,
  togglePayPrintBtn
} from "../pos-logic-be";
import { mockProduct } from "./mock_product";
import { ObjectID } from "bson";
import { mockOrder } from "./mock-order";
const dayjs = require("dayjs");
const orm = require("schemahandler");
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const { stringify } = require("schemahandler/utils");
//jest.useFakeTimers("modern").setSystemTime(new Date("2021-01-01").getTime());
require("mockdate").set(new Date("2021-01-01").getTime());

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("../pos-logic");

const delay = require("delay");

const foodTax = { taxes: [5, 10] };
const drinkTax = { taxes: [16, 32] };

const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
const ketchup = { name: "Add Ketchup", price: 3, quantity: 1 };

beforeAll(async () => {
  orm.connect({ uri: "mongodb://localhost:27017" }, "myproject");
  orm.registerSchema("Order", {
    items: [{}]
  });
  await orm("Order").deleteMany();
  await orm("Commit").deleteMany();

  orm.plugin(syncPlugin);
  orm.plugin(syncFlow);
  orm.registerCommitBaseCollection("Order");
  orm.plugin(require("../../../backend/commit/orderCommit"));
  orm.registerCollectionOptions("Order");
  orm.emit("commit:flow:setMaster", true);
});

afterEach(async () => {
  await orm("Order")
    .deleteMany()
    .direct();
  await orm("Commit")
    .deleteMany()
    .direct();
});

let actions = [];
["showOrderReceipt", "pay", "printOrder"].forEach(e =>
  hooks.on(e, () => actions.push(e))
);
let expectArray = () => [
  "payBtnClickable",
  payBtnClickable.value,
  "payPrintMode",
  payPrintMode.value,
  "showIcon",
  showIcon.value,
  "disablePay",
  disablePay.value,
  actions
];
//</editor-fold>

describe("pos-logic", function() {
  it("Create duplicate order", async () => {
    const m1 = await orm("Order")
      .create({ table: 10, items: [], status: "inProgress" })
      .commit("createOrder");

    expect(stringify(m1)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "items": Array [],
        "status": "inProgress",
        "table": 10,
      }
    `);

    const m2 = await orm("Order")
      .create({ table: 10, items: [], inProgress: true })
      .commit("createOrder");

    expect(m2).toMatchInlineSnapshot(`undefined`);
  });

  it("case 2a: create Order + addProduct", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 2b: create Order + add 2 products", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 2c: create Order + addModifier", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    actionList.value.length = 0;
    addModifier(order, ketchup);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 2d: create Order + removeModifier", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    addModifier(order, ketchup);
    await nextTick();
    actionList.value.length = 0;
    removeModifier(order, 0, 0);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  //todo: remove modifiers

  it("case 3: updateItem", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    actionList.value.length = 0;
    updateItem(order, 0, { quantity: 10, course: 3 });
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  //todo: test integration discount -> backend -> query snapshot
  it("case 4: discount", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    makeDiscount(order, "50%");
    await nextTick();
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
    for (const chain of _.cloneDeep(actionList.value)) {
      await orm.execChain({ name: "Order", chain: chain }, true);
    }
    const _order = await orm("Order").findOne();
    expect(stringify(_order)).toMatchSnapshot();
  });

  it("case 5: change course", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    changeCourse(order, 0, -1);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 6: removeItem", async function() {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    actionList.value.length = 0;
    removeItem(order, 0, 1);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 7: currentTable", async function() {
    prepareOrder("10");
    let order = getCurrentOrder();
    await nextTick();

    prepareOrder("12");
    order = getCurrentOrder();
    await nextTick();

    expect(currentTable.value).toMatchInlineSnapshot(`"12"`);
  });

  it("case 8: logic-ui", async function() {
    prepareOrder("10");
    let order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    //simulateBackendPrint(order);
    await nextTick();

    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        true,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        true,
        Array [],
      ]
    `);

    quickBtnAction.value = "receipt";
    onlyCheckoutPrintedItems.value = false;
    togglePayPrintBtn();
    togglePayPrintBtn();
    await nextTick();
    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        true,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        false,
        Array [
          "printOrder",
        ],
      ]
    `);
  });

  it("case 9: order from backend: change quantity", async function() {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    changeItemQuantity(order, 0, 1);
    await nextTick();
    // h làm cho items -> compare to snapshot ở hàm payBtnClickable

    expect(itemQuantityChangeCheck(order.items[0])).toMatchInlineSnapshot(
      `true`
    );
    //disable pay = true moi dung
    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        true,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        true,
        Array [],
      ]
    `);
  });

  it("case 10: order from backend: cancel item", async function() {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    await nextTick();

    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        false,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        true,
        Array [],
      ]
    `);
  });
});