import cms from 'cms'
import {
  addItem, addModifier, addMultiPayment,
  addSinglePayment,
  addUser, cancelOrder,
  createOrder,
  getRestTotal,
  makeEOD, makeLastItemDiscount,
  makePaid, makeTakeaway, removeItem
} from '../OrderView/pos-logic';
import moment from 'moment';
import { nextTick } from 'vue';

export async function prepareDb () {
  const Order = cms.getModel('Order')
  await Order.remove();
  await cms.getModel('EndOfDay').remove()
  await cms.getModel('EndOfDay').create([{ z: 1 }, { z: 2 }]);

  const foodTax = { taxes: [5, 10] };
  const drinkTax = { taxes: [16, 32] };

  const cola = { name: "Cola", price: 1.3, category: "drink", ...drinkTax };
  const fanta = { name: "Fanta", price: 2, category: "drink", ...drinkTax };
  const rice = { name: "Rice", price: 10, category: "food", ...foodTax };
  const ketchup = { name: "Add Ketchup", price: 3 };

  async function makeOrder(initValue, cb, afterPaidCb) {
    let order = createOrder(initValue);
    if (cb) await cb(order);
    makePaid(order);
    afterPaidCb && afterPaidCb(order);
    await nextTick();
    await Order.create(order);
  }

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    addItem(order, fanta, 2);
    await nextTick();
    addSinglePayment(order, { type: "cash", value: getRestTotal(order) });
    order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
    makeEOD(order, 1);
    addUser(order, "Waiter 1");
  });

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    addItem(order, rice, 2);
    removeItem(order, 1, 1);
    addModifier(order, ketchup);
    await nextTick();
    addMultiPayment(order, { type: "card", value: 2 });
    await nextTick();
    addMultiPayment(order, { type: "cash", value: getRestTotal(order) });
    order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
    makeEOD(order, 1);
    addUser(order, "Waiter 2");
  });

  await makeOrder(
    { date: new Date() },
    async order => {
      addItem(order, cola, 2);
      removeItem(order, 0, 1);
      makeTakeaway(order);
      await nextTick();
      addSinglePayment(order, { type: "cash", value: getRestTotal(order) });
      order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
      makeEOD(order, 1);
      addUser(order, "Waiter 1");
    },
    async order => {
      cancelOrder(order);
    }
  );

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    makeLastItemDiscount(order, "40%");
    await nextTick();
    addSinglePayment(order, { type: "card", value: getRestTotal(order) });
    order.date = moment("06.01.2021", "DD.MM.YYYY").toDate();
    makeEOD(order, 2);
    addUser(order, "Waiter 1");
  });

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    await nextTick();
    addSinglePayment(order, { type: "card", value: getRestTotal(order) });
    order.date = moment("07.01.2021", "DD.MM.YYYY").toDate();
    addUser(order, "Waiter 1");
  });
}