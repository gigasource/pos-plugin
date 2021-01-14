//region declare
import { nextTick } from "vue";
import {
  createRoom,
  addRoomObject,
  removeRoomObject,
  moveOrderToNewTable,
  makeTakeAway,
  updateRoomObjects,
  updateRoomObject
} from "./room-logic";
import _ from "lodash";
import {
  createOrder,
  addItem as addOrderItem,
  makePaid
} from "../../backend/order-logic/pos-logic";

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
    addRoomObject(room, table1);

    addRoomObject(room, table2);

    addRoomObject(room, wall1);
  });
}

beforeAll(async () => {
  await prepareDb();
});
//endregion

describe("room-logic", function() {
  it("createRoom should work", () => {
    const { room } = createRoom();
    addRoomObject(room, table1);
    addRoomObject(room, table2);
    expect(room.roomObjects.length).toEqual(2);
  });
  it("createRoom should keep attributes", () => {
    const { room } = createRoom({
      name: "room1",
      roomObjects: [table1],
      order: 10
    });
    expect(room.name).toEqual("room1");
    expect(room.order).toEqual(10);
    expect(room.roomObjects.length).toEqual(1);
    expect(room.roomObjects[0].name).toEqual("table 1");
  });
  it("remove room object should work", () => {
    const { room } = createRoom();
    addRoomObject(room, table1);
    addRoomObject(room, table2);
    removeRoomObject(room, table1);
    expect(room.roomObjects.length).toEqual(1);
    expect(room).toMatchInlineSnapshot(`
      Object {
        "roomObjects": Array [
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
    removeRoomObject(room, table1);
    expect(room.roomObjects.length).toEqual(1);
    removeRoomObject(room, table2);
    expect(room.roomObjects.length).toEqual(0);
  });
  it("zoom should change", async () => {
    const { room, zoom, viewH, viewW, w1, h1 } = createRoom();
    await nextTick();
    expect(zoom.value).toEqual(1);

    [viewW.value, viewH.value] = [VIEW_W, VIEW_H];
    addRoomObject(room, table1);
    await nextTick();
    expect([
      "w1",
      w1.value,
      "h1",
      h1.value,
      "zoom",
      zoom.value,
      "realLocation",
      room.roomObjects[0].realLocation,
      "realSize",
      room.roomObjects[0].realSize
    ]).toMatchInlineSnapshot(`
      Array [
        "w1",
        15,
        "h1",
        20,
        "zoom",
        5,
        "realLocation",
        Object {
          "x": 25,
          "y": 50,
        },
        "realSize",
        Object {
          "height": 50,
          "width": 50,
        },
      ]
    `);

    addRoomObject(room, table2);
    addRoomObject(room, wall1);
    await nextTick();
    expect(h1.value).toEqual(60);
    expect(w1.value).toEqual(60);
    expect(room.roomObjects[0].realLocation).toMatchInlineSnapshot(`
      Object {
        "x": 8.333333333333334,
        "y": 16.666666666666668,
      }
    `);
    expect(room.roomObjects[0].realSize).toMatchInlineSnapshot(`
      Object {
        "height": 16.666666666666668,
        "width": 16.666666666666668,
      }
    `);
    expect(zoom.value).toEqual(100 / 60);
  });

  it("should move order", async () => {
    const { room } = createRoom();
    addRoomObject(room, table1);
    addRoomObject(room, table2);
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
  it("should set table type to take away", () => {
    const _table1 = _.cloneDeep(table1);
    expect(_table1.takeAway).toBeFalsy();
    makeTakeAway(_table1);
    expect(_table1.takeAway).toBeTruthy();
  });

  it("should update a single room object data", async () => {
    const { room, viewH, viewW } = createRoom();
    addRoomObject(room, table1);
    addRoomObject(room, table2);
    expect(table1.name).toBe("table 1");
    const newObj = updateRoomObject(room, table1, {
      name: "new name",
      bgColor: "red"
    });
    expect(newObj.name).toBe("new name");
    expect(newObj.bgColor).toBe("red");
  });
  it("should update room objects", async () => {
    const { room, viewW, viewH } = createRoom();
    addRoomObject(room, table1);
    addRoomObject(room, table2);

    viewW.value = VIEW_W;
    viewH.value = VIEW_H;
    const newRoomObjects = [table1, table2, wall1];
    updateRoomObjects(room, newRoomObjects);
    await nextTick();
    expect(room.roomObjects.length).toBe(3);
    expect(room.roomObjects).toMatchInlineSnapshot(`
      Array [
        Object {
          "location": Object {
            "x": 5,
            "y": 10,
          },
          "name": "table 1",
          "realLocation": Object {
            "x": 8.333333333333334,
            "y": 16.666666666666668,
          },
          "realSize": Object {
            "height": 16.666666666666668,
            "width": 16.666666666666668,
          },
          "size": Object {
            "height": 10,
            "width": 10,
          },
        },
        Object {
          "location": Object {
            "x": 50,
            "y": 50,
          },
          "name": "table 2",
          "realLocation": Object {
            "x": 83.33333333333334,
            "y": 83.33333333333334,
          },
          "realSize": Object {
            "height": 16.666666666666668,
            "width": 16.666666666666668,
          },
          "size": Object {
            "height": 10,
            "width": 10,
          },
        },
        Object {
          "location": Object {
            "x": 30,
            "y": 10,
          },
          "name": "wall 1",
          "realLocation": Object {
            "x": 50,
            "y": 16.666666666666668,
          },
          "realSize": Object {
            "height": 3.3333333333333335,
            "width": 16.666666666666668,
          },
          "size": Object {
            "height": 2,
            "width": 10,
          },
        },
      ]
    `);
  });
});
