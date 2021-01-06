//region declare
import { nextTick } from "vue"

const {
  createRoom,
  addRoomItem,
  removeRoomItem,
  moveOrderToNewTable,
  activeTables,
  isBusyTable,
  fetchInProgressTables
} = require("./room-logic");

const {
  createOrder,
  addItem: addOrderItem,
  makePaid
} = require("../../backend/order-logic/pos-logic");

const orm = require("schemahandler");

const table1 = {
  name: "table 1",
  location: { x: 5, y: 10 },
  size: { width: 10, height: 10 }
};
const table2 = {
  name: "table 2",
  location: { x: 50, y: 50 },
  size: { width: 10, height: 10 }
};
const wall1 = {
  name: "wall 1",
  location: { x: 30, y: 10 },
  size: { width: 10, height: 2 }
};
const drinkTax = { taxes: [16, 32] };

const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };

const cms = {
  getModel(col) {
    return orm(col);
  }
};

const VIEW_W = 100;
const VIEW_H = 100;

orm.connect("mongodb://localhost:27017", "roomTest");
const Room = cms.getModel("Room");

async function prepareDb() {
  await Room.remove({});

  async function makeRoom(cb) {
    let { room } = createRoom();
    if (cb) await cb(room);
    await nextTick();
    await Room.create(room);
  }

  await makeRoom(async room => {
    addRoomItem(room, table1);

    addRoomItem(room, table2);

    addRoomItem(room, wall1);
  });
}

beforeAll(async () => {
  await prepareDb();
});
//endregion

describe("room-logic", function() {
  it("createRoom should work", () => {
    const { room } = createRoom();
    addRoomItem(room, table1);
    addRoomItem(room, table2);
    expect(room.items.length).toEqual(2);
  });
  it("remove item should work", () => {
    const { room } = createRoom();
    addRoomItem(room, table1);
    addRoomItem(room, table2);
    removeRoomItem(room, table1);
    expect(room).toMatchInlineSnapshot(`
      Object {
        "items": Array [
          Object {
            "location": Object {
              "x": 50,
              "y": 50,
            },
            "name": "table 2",
            "size": Object {
              "height": 10,
              "width": 10,
            },
          },
        ],
      }
    `);
  });
  it("zoom should equal 1", async () => {
    const { room, zoom, viewH, viewW, w1, h1 } = createRoom();
    await nextTick();
    expect(zoom.value).toEqual(1);

    viewW.value = VIEW_W;
    viewH.value = VIEW_H;
    addRoomItem(room, table1);
    await nextTick();
    expect(w1.value).toEqual(15);
    expect(h1.value).toEqual(20);
    expect(zoom.value).toEqual(5);
    expect(room.items[0].realLocation).toMatchInlineSnapshot(`
      Object {
        "x": 25,
        "y": 50,
      }
    `);
    expect(room.items[0].realSize).toMatchInlineSnapshot(`
      Object {
        "height": 50,
        "width": 50,
      }
    `);
    addRoomItem(room, table2);
    addRoomItem(room, wall1);
    await nextTick();
    expect(h1.value).toEqual(60);
    expect(w1.value).toEqual(60);
    expect(room.items[0].realLocation).toMatchInlineSnapshot(`
      Object {
        "x": 8.333333333333334,
        "y": 16.666666666666668,
      }
    `);
    expect(room.items[0].realSize).toMatchInlineSnapshot(`
      Object {
        "height": 16.666666666666668,
        "width": 16.666666666666668,
      }
    `);
    expect(zoom.value).toEqual(100 / 60);
  });

  it("should fetch all active orders correctly", async () => {
    const Order = cms.getModel("Order");
    await Order.remove({});
    const order = createOrder({ table: "table 1" });
    addOrderItem(order, cola);
    const order1 = createOrder({ table: "table 2" });
    addOrderItem(order1, cola);
    await Order.create(order);
    await Order.create(order1);
    await nextTick();
    await fetchInProgressTables();
    expect(activeTables.value.length).toEqual(2);
    expect(isBusyTable(table2)).toEqual(true);
    makePaid(order1);
    await cms.getModel("Order").updateOne({ table: "table 2" }, order1);
    await fetchInProgressTables();
    expect(activeTables.value.length).toEqual(1);
    expect(isBusyTable(table2)).toEqual(false);
  });

  it("should move order", async () => {
    const { room } = createRoom();
    addRoomItem(room, table1);
    addRoomItem(room, table2);
    await nextTick();
    const Order = cms.getModel("Order");
    await Order.remove({});
    const order = createOrder({ table: "table 1" });
    addOrderItem(order, cola);
    await nextTick();
    await Order.create(order);
    const orderInDb = await cms.getModel("Order").findOne({ table: "table 1" });
    expect(orderInDb.table).toEqual("table 1");
    await moveOrderToNewTable(table1, table2);
    const newOrderInDb = await cms
      .getModel("Order")
      .findOne({ _id: orderInDb._id });
    expect(newOrderInDb.table).toEqual("table 2");
  });
});
