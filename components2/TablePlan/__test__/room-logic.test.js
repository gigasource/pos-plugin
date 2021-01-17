//region declare
import { nextTick } from "vue";
import {
  createRoom,
  addRoomObject,
  removeRoomObject,
  updateRoomObjects,
  updateRoomObject
} from "../roomLogics";

import { viewH, viewW } from "../RoomLogics";

import { ObjectId } from "bson";

import { stringify } from "schemahandler/utils";

const orm = require("schemahandler");
const table1 = {
  name: "table 1",
  location: { x: 5, y: 10 },
  size: { width: 10, height: 10 },
  _id: new ObjectId().toString()
};
const table2 = {
  name: "table 2",
  location: { x: 50, y: 50 },
  size: { width: 10, height: 10 },
  _id: new ObjectId().toString()
};
const wall1 = {
  name: "wall 1",
  location: { x: 30, y: 10 },
  size: { width: 10, height: 2 },
  _id: new ObjectId().toString()
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
    expect(stringify(room)).toMatchInlineSnapshot(`
      Object {
        "roomObjects": Array [
          Object {
            "_id": "ObjectID",
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
    const { room, zoom } = createRoom();
    await nextTick();
    expect(zoom.value).toEqual(1);

    [viewW.value, viewH.value] = [VIEW_W, VIEW_H];
    addRoomObject(room, table1);
    await nextTick();
    expect([
      "zoom",
      zoom.value,
      "realLocation",
      room.roomObjects[0].realLocation,
      "realSize",
      room.roomObjects[0].realSize
    ]).toMatchInlineSnapshot(`
      Array [
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

  // todo: move this test to correct place
  // it("should move order", async () => {
  //   const { room } = createRoom();
  //   addRoomObject(room, table1);
  //   addRoomObject(room, table2);
  //   await nextTick();
  //   const Order = cms.getModel("Order");
  //   await Order.remove({});
  //   const order = createOrder({ table: "table 1" });
  //   addOrderItem(order, cola);
  //   await nextTick();
  //   await Order.create(order);
  //   const orderInDb = await cms.getModel("Order").findOne({ table: "table 1" });
  //   expect(orderInDb.table).toEqual("table 1");
  //   await moveOrderToNewTable(table1, table2);
  //   const newOrderInDb = await cms
  //     .getModel("Order")
  //     .findOne({ _id: orderInDb._id });
  //   expect(newOrderInDb.table).toEqual("table 2");
  // });

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
});
