import orm from 'schemahandler';
import { addRoomObject, createRoom } from '../../TablePlan/room-logic';
import { nextTick } from 'vue';
import { addItem as addOrderItem, createOrder, makePaid } from '../../../backend/order-logic/pos-logic';
import cms from 'cms'

const prepareDb = async function() {
  const table1 = {
    name: "table1",
    location: { x: 5, y: 10 },
    size: { width: 10, height: 10 }
  };
  const table2 = {
    name: "table2",
    location: { x: 50, y: 50 },
    size: { width: 10, height: 10 }
  };
  const wall1 = {
    name: "wall1",
    location: { x: 30, y: 10 },
    size: { width: 10, height: 2 }
  };
  const drinkTax = { taxes: [16, 32] };

  const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };

  const VIEW_W = 100;
  const VIEW_H = 100;

  const Room = cms.getModel("Room");
  const Order = cms.getModel("Order");

  let cur = 0;

  const roomNames = ["room1", "room2", "room3"];

  await Room.remove({});
  await Order.remove({});

  async function makeRoom(roomName, cb) {
    let { room } = createRoom({ name: roomName });
    if (cb) await cb(room);
    await nextTick();
    await Room.create(room);
  }

  await makeRoom("room1", room => {
    addRoomObject(room, table1);
  });

  await makeRoom("room2", room => {
    addRoomObject(room, table2);
    addRoomObject(room, wall1);
  });

  async function makeOrder(orderName, tableName, cb) {
    let order = createOrder({ name: orderName, table: tableName });
    if (cb) await cb(order);
    await nextTick();
    await Order.create(order);
  }

  await makeOrder("order 1", "table1", async order => {
    addOrderItem(order, cola);
  });

  await makeOrder("order 2", "table2", async order => {
    addOrderItem(order, cola);
    addOrderItem(order, cola);
    makePaid(order);
  });
}

export default prepareDb
