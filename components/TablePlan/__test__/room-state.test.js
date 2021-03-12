//region declare
import { nextTick } from "vue";
import { createRoom, addRoomObject } from "../RoomLogics";

import { stringify } from "schemahandler/utils";
import { ObjectID } from "bson";
import {
  roomsStates,
  selectingRoomStates,
  fetchRooms,
  objectsInSelectingRoom,
  addRoom,
  removeRoom,
  onSelectRoom,
  newRoomName,
  nextOrder,
  updateSelectingRoomName,
  swapSelectingRoomOrderWithTheRoomBefore,
  swapSelectingRoomOrderWithTheRoomBehind
} from "../RoomState";

import {
  createOrder,
  addItem as addOrderItem,
  makePaid
} from "../../../backend/order-logic/pos-logic";

const table1 = {
  name: "table 1",
  location: { x: 5, y: 10 },
  size: { width: 10, height: 10 }
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
  size: { width: 10, height: 2 }
};
const drinkTax = { taxes: [16, 32] };

const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };

import cms from "cms";

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
    makePaid(order);
  });
}

beforeAll(async () => {
  await prepareDb();
});
//endregion

describe("test room states", function() {
  it("should ", async () => {
    await fetchRooms();
    expect(roomsStates.value.length).toEqual(2);
    //expect: rooms should be sorted by order
    expect(
      roomsStates.value.map(r => ({
        name: r.room.name,
        order: r.room.order
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "room2",
          "order": 1,
        },
        Object {
          "name": "room1",
          "order": 3,
        },
      ]
    `);
    onSelectRoom(roomsStates.value[0]);
    await nextTick();
    expect(stringify(objectsInSelectingRoom.value)).toMatchInlineSnapshot(
      `Array []`
    );
    // test addRoom
    await addRoom(room3);

    await fetchRooms();
    expect(
      roomsStates.value.map(r => ({
        name: r.room.name,
        order: r.room.order
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "room2",
          "order": 1,
        },
        Object {
          "name": "room3",
          "order": 2,
        },
        Object {
          "name": "room1",
          "order": 3,
        },
      ]
    `);
    // test removeRoom
    await removeRoom(room1);
    expect(
      roomsStates.value.map(r => ({
        name: r.room.name,
        order: r.room.order
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "room2",
          "order": 1,
        },
        Object {
          "name": "room3",
          "order": 2,
        },
      ]
    `);

    // test newRoomName
    expect(newRoomName.value).toEqual("1");
    await addRoom(room4);
    expect(newRoomName.value).toEqual("2");

    // test nextOrder
    expect(nextOrder.value).toEqual(5);

    //test updateSelectingRoomName
    onSelectRoom(createRoom(room4));
    await nextTick();
    await updateSelectingRoomName("room4");
    expect(
      roomsStates.value.map(r => ({
        name: r.room.name,
        order: r.room.order
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "room2",
          "order": 1,
        },
        Object {
          "name": "room3",
          "order": 2,
        },
        Object {
          "name": "room4",
          "order": 4,
        },
      ]
    `);

    //test swapSelectingRoomOrderWithTheRoomBefore
    await swapSelectingRoomOrderWithTheRoomBefore();
    expect(
      roomsStates.value.map(r => ({
        name: r.room.name,
        order: r.room.order
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "room2",
          "order": 1,
        },
        Object {
          "name": "room4",
          "order": 2,
        },
        Object {
          "name": "room3",
          "order": 4,
        },
      ]
    `);

    await swapSelectingRoomOrderWithTheRoomBehind();
    //test swapSelectingRoomOrderWithTheRoomBehind
    expect(
      roomsStates.value.map(r => ({
        name: r.room.name,
        order: r.room.order
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "room2",
          "order": 1,
        },
        Object {
          "name": "room4",
          "order": 2,
        },
        Object {
          "name": "room3",
          "order": 4,
        },
      ]
    `);
  });

  // it("should know tables status", async () => {
  //   await fetchRooms();
  //   await appHooks.emit("orderChange");
  //   await nextTick();
  //   expect(activeOrders.value.length).toEqual(1);
  //   expect(inProgressTables.value.length).toEqual(1);
  //   expect(inProgressTables.value[0]).toEqual("table 1");
  //   expect(isBusyTable(table1)).toBeTruthy();
  //   expect(isBusyTable(table2)).toBeFalsy();
  // });
  // it("should be able to add/remove room", async () => {
  //   await fetchRooms();
  //   const createdRoom = await addRoom({ name: "room3" });
  //   let roomsInDb = await cms.getModel('Room').find({})
  //   expect(roomsInDb.length).toEqual(3)
  //   expect(rooms.value.length).toBe(3);
  //   await removeRoom(createdRoom );
  //   expect(rooms.value.length).toBe(2);
  //   roomsInDb = await cms.getModel('Room').find({})
  //   expect(roomsInDb.length).toEqual(2)
  //   expect(createdRoom.name).toEqual('room3')
  //   expect(createdRoom._id).toBeTruthy()
  // });
  // it("should be able to get order info for a table", async () => {
  //   await fetchRooms();
  //   await appHooks.emit("orderChange");
  //   const orderInf = getTableOrderInfo(table1);
  //   expect(orderInf).toBeTruthy()
  // });
  // it("should be able to add new room object", async() => {
  //   await fetchRooms()
  //   selectingRoom.value = rooms.value[0]
  //   await nextTick()
  //   let selectingRoomInDb = await cms.getModel('Room').findOne({_id: selectingRoom.value._id})
  //   expect(selectingRoomInDb.roomObjects.length).toEqual(1)
  //   const createdObject = await addNewRoomObjectToSelectingRoom({ name: "123", _id: new ObjectID()})
  //   expect(createdObject.name).toEqual('123')
  //   expect(createdObject._id).toBeTruthy()
  //   selectingRoomInDb = await cms.getModel('Room').findOne({_id: selectingRoom.value._id})
  //   expect(selectingRoomInDb.roomObjects.length).toEqual(2)
  // })
  //
  // it("should be able to remove room object", async() => {
  //   await fetchRooms()
  //   selectingRoom.value = rooms.value[0]
  //   await nextTick()
  //   let selectingRoomInDb = await cms.getModel('Room').findOne({_id: selectingRoom.value._id})
  //   expect(selectingRoomInDb.roomObjects.length).toEqual(1)
  //   expect(objectsInSelectingRoom.value.length).toEqual(1)
  //   await removeAnObjectFromSelectingRoom(table1)
  //   selectingRoomInDb = await cms.getModel('Room').findOne({_id: selectingRoom.value._id})
  //   expect(selectingRoomInDb.roomObjects.length).toEqual(0)
  //   expect(objectsInSelectingRoom.value.length).toEqual(0)
  // })
  //
  // it("should be able to decide new name for object", async () => {
  //   await fetchRooms();
  //   selectingRoom.value = rooms.value[0];
  //   await addNewRoomObjectToSelectingRoom({ name: "1" });
  //   await addNewRoomObjectToSelectingRoom({ name: "2" });
  //   await nextTick();
  //   expect(newObjectName.value).toEqual("3");
  //   await addNewRoomObjectToSelectingRoom({ name: "5" });
  //   expect(newObjectName.value).toEqual("3");
  //   await addNewRoomObjectToSelectingRoom({ name: "4" });
  //   await addNewRoomObjectToSelectingRoom({ name: "3" });
  //   expect(newObjectName.value).toEqual("6");
  // });
  // it("should be able to update object data", async () => {
  //   await fetchRooms()
  //   selectingRoom.value = rooms.value[0]
  //   onSelectObject(table1)
  //   await nextTick()
  //   let table1InDb = (await cms.getModel('Room').findOne({_id: selectingRoom.value._id})).roomObjects[0]
  //   expect(table1InDb.location.x).toEqual(5)
  //   expect(table1InDb.location.y).toEqual(10)
  //   let table1Md = objectsInSelectingRoom.value[0]
  //   expect(table1Md.location.x).toEqual(5)
  //   expect(table1Md.location.y).toEqual(10)
  //   await updateObjectInSelectingRoom(table1, { location: {x: 15, y: 20}, size: {width: 4, height: 7}})
  //   table1Md = objectsInSelectingRoom.value[0]
  //   expect(table1Md.location.x).toEqual(15)
  //   expect(table1Md.location.y).toEqual(20)
  //   table1InDb = (await cms.getModel('Room').findOne({_id: selectingRoom.value._id})).roomObjects[0]
  //   expect(table1InDb.location.x).toEqual(15)
  //   expect(table1InDb.location.y).toEqual(20)
  //   expect(selectingObject.value.location.x).toEqual(15)
  //   expect(selectingObject.value.location.y).toEqual(20)
  // })
  //
  // it("should be able to change room name", async() => {
  //   await fetchRooms()
  //   selectingRoom.value = rooms.value[0]
  //   await updateRoomName({ _id: selectingRoom.value._id, name: "new name"})
  //   const newRoomInf = await cms.getModel('Room').findOne({_id: selectingRoom.value._id})
  //   expect(newRoomInf.name).toEqual("new name")
  //
  // })
});
