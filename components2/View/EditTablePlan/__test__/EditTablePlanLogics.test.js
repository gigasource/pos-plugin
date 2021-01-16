import { nextTick } from "vue";
import { createRoom, addRoomObject } from "../../../TablePlan/RoomLogics";

import { stringify } from "schemahandler/utils";
import { ObjectID } from "bson";
import {
  fetchRooms,
  objectsInSelectingRoom,
  onSelectRoom
} from "../../../TablePlan/RoomState";

import {
  createOrder,
  addItem as addOrderItem,
  makePaid
} from "../../../../backend/order-logic/pos-logic";

const table1 = {
  name: "table 1",
  location: { x: 5, y: 10 },
  size: { width: 10, height: 10 },
  _id: new ObjectID()
};
const table2 = {
  name: "table 2",
  location: { x: 50, y: 50 },
  size: { width: 10, height: 10 },
  _id: new ObjectID()
};
const wall1 = {
  name: "wall 1",
  location: { x: 30, y: 10 },
  size: { width: 10, height: 2 },
  _id: new ObjectID()
};

const wall2 = {
  name: "wall 2",
  location: { x: 30, y: 10 },
  size: { width: 10, height: 2 },
  _id: new ObjectID()
};
const drinkTax = { taxes: [16, 32] };

const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };

import cms from "cms";
import {
  addNewRoomObjectToSelectingRoom, onChangeObjectName,
  onSelectObject,
  selectingObject
} from '../EditTablePlanLogics';

const VIEW_W = 100;
const VIEW_H = 100;

const Room = cms.getModel("Room");
const Order = cms.getModel("Order");

let cur = 0;

const room1 = { name: "room1", order: 3, _id: new ObjectID().toString() };
const room2 = { name: "room2", order: 1, _id: new ObjectID().toString() };
const room3 = { name: "room3", order: 2, _id: new ObjectID().toString() };
const room4 = { name: "1", order: 4, _id: new ObjectID().toString() };

async function prepareDb() {
  await Room.remove({});
  await Order.remove({});

  async function makeRoom(roomInfo, cb) {
    let { room } = createRoom(roomInfo);
    if (cb) await cb(room);
    await nextTick();
    await Room.create(room);
  }

  await makeRoom(room1, room => {
    addRoomObject(room, table1);
  });

  await makeRoom(room2, room => {
    addRoomObject(room, table2);
    addRoomObject(room, wall1);
  });

  async function makeOrder(orderName, tableName, cb) {
    let order = createOrder({ name: orderName, table: tableName });
    if (cb) await cb(order);
    await nextTick();
    await Order.create(order);
  }

  await makeOrder("order 1", "table 1", async order => {
    addOrderItem(order, cola);
  });

  await makeOrder("order 2", "table 2", async order => {
    addOrderItem(order, cola);
    addOrderItem(order, cola);
  });
}

beforeAll(async () => {
  await prepareDb();
});

describe("test edit table plan logic", () => {
  it("should", async () => {
    const roomObjectsStringify = objects => {
      return stringify(
        objects.map(obj => ({
          name: obj.name
        }))
      );
    };
    // test onSelectObject
    await fetchRooms();
    await onSelectRoom(createRoom(room2));
    onSelectObject(table2);
    await nextTick();
    expect(stringify(selectingObject.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "location": Object {
          "x": 50,
          "y": 50,
        },
        "name": "table 2",
        "realLocation": Object {
          "x": 50,
          "y": 50,
        },
        "realSize": Object {
          "height": 10,
          "width": 10,
        },
        "size": Object {
          "height": 10,
          "width": 10,
        },
      }
    `);

    //test addNewRoomObjectToSelectingRoom
    await addNewRoomObjectToSelectingRoom(wall2);
    await nextTick();
    expect(roomObjectsStringify(objectsInSelectingRoom.value))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "table 2",
        },
        Object {
          "name": "wall 1",
        },
        Object {
          "name": "wall 2",
        },
      ]
    `);

    // test onChangeObjectName
    onSelectObject(wall2)
    await onChangeObjectName('wall3')
    expect(roomObjectsStringify(objectsInSelectingRoom.value)).toMatchInlineSnapshot()

    // test removeAnObjectFromSelectingRoom
    // await
  });
});
