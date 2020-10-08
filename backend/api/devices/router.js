const express = require('express');
const createDeviceApiRequestHandlers = require('./request-handler');

function createDeviceRouter(deviceType) {
  const {
    getDeviceById,
    getAllDevices,
    getAssignedStoreOfDevice,
    getDeviceOnlineStatus,
    getStoreGoogleMyBusinessId,
    getStoreMonthlyReport,
    getStoreLocale,
    getStoreSettings,
    getStoreOrders,
    getOrderById,
    registerDevice,
    deleteDeviceById,
    updateDeviceMetadata,
    reverseGeoWithLatLong,
  } = createDeviceApiRequestHandlers(deviceType);

  const router = express.Router();

  router.get('/devices/:clientId', getDeviceById);

  router.get('/devices', getAllDevices);

  router.delete('/devices/:deviceId', deleteDeviceById);

  router.get('/device-assigned-store/:deviceId', getAssignedStoreOfDevice);

  router.get('/device-online-status', getDeviceOnlineStatus);

  router.post('/register', registerDevice);

  router.put('/device-metadata', updateDeviceMetadata);

  router.get('/reverse-geocoder', reverseGeoWithLatLong);

  router.get('/google-my-business-id', getStoreGoogleMyBusinessId);

  router.get('/monthly-report', getStoreMonthlyReport);

  router.get('/store-locale', getStoreLocale);

  router.get('/store-settings', getStoreSettings);

  router.get('/get-orders', getStoreOrders);

  router.get('/order/:id', getOrderById);

  return router;
}

module.exports = createDeviceRouter;
