const {getInternalSocketIOServer} = require('./external-socket-server');

const StoreModel = cms.getModel('Store');
const OrderModel = cms.getModel('Order');

async function updateOrderStatus(orderToken, status) {
  const storeName = status ? status.storeName : '';
  const storeAlias = status ? status.storeAlias : '';
  const internalSocketIOServer = getInternalSocketIOServer();

  console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
    `10.1. Online order backend: update order status, status = ${status.status}`, JSON.stringify(sendOrderTimeouts));

  if (sendOrderTimeouts[orderToken]) {
    console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
      `10.2. Online order backend: clear timeout, status = ${status.status}`);

    clearTimeout(sendOrderTimeouts[orderToken]);
    delete sendOrderTimeouts[orderToken];
  }

  console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
    `10.3. Online order backend: emit status to frontend, status = ${status.status}`, JSON.stringify(sendOrderTimeouts));
  internalSocketIOServer.to(orderToken).emit('updateOrderStatus', status);

  if (status.status === 'kitchen') {
    const {storeAlias, total} = status;
    if (!storeAlias) return;

    const store = await StoreModel.findOne({alias: storeAlias}).lean();
    await updateStoreReport(store._id, {orders: 1, total});
  }

  console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
    `10.4. Online order backend: update db, status = ${status.status}`);
  await OrderModel.findOneAndUpdate({onlineOrderId: orderToken}, {status: status.status});
}

module.exports = {
  updateOrderStatus,
}
