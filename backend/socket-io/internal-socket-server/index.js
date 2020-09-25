const createDeviceEventListeners = require('./listeners/devices');
const createGeoLocationEventListeners = require('./listeners/geo-locations');
const createMiscellaneousEventListeners = require('./listeners/miscs');
const createOrderAndReservationEventListeners = require('./listeners/orders-and-reservations');
const createStoreEventListeners = require('./listeners/stores');

let internalSocketIOServer;

function createInternalSocketIOServer(cms) {
  const {socket} = cms;

  // internalSocketIOServer is another Socket.io namespace for frontend to connect (use /app namespace)
  internalSocketIOServer = socket;

  internalSocketIOServer.on('connect', (socket) => {
    createDeviceEventListeners(socket);
    createGeoLocationEventListeners(socket);
    createMiscellaneousEventListeners(socket);
    createOrderAndReservationEventListeners(socket);
    createStoreEventListeners(socket);
  });
}

function getInternalSocketIOServer() {
  return internalSocketIOServer;
}

module.exports = {
  createInternalSocketIOServer,
  getInternalSocketIOServer,
}
