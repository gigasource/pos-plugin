const {getExternalSocketIOServer} = require('../../external-socket-server');
const {WATCH_DEVICE_STATUS_ROOM_PREFIX} = require('../../constants');

const DeviceModel = cms.getModel('Device');

function createDeviceEventListeners(socket) {
  socket.on('getOnlineDeviceIds', async callback => {
    const externalSocketIOServer = getExternalSocketIOServer();
    if (global.APP_CONFIG.redis) {
      try {
        const clusterClientList = await externalSocketIOServer.getClusterClientIds();
        return callback(Array.from(clusterClientList));
      } catch (e) {
        console.error(e);
      }
    }

    callback(externalSocketIOServer.getAllClientId());
  });

  socket.on('watchDeviceStatus', clientIdList => clientIdList.forEach(clientId => socket.join(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`)));

  socket.on('unwatchDeviceStatus', clientIdList => clientIdList.forEach(clientId => socket.leave(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`)));

  socket.on('updateMasterDevice', async (storeId) => {
    const master = await DeviceModel.findOne({ storeId, deviceType: { $ne: 'gsms' }, master: true}).lean();
    await getExternalSocketIOServer().emitToPersistent(master._id.toString(), 'updateMasterDevice');
  });

  socket.on('unpairDevice', async deviceId => {
    await getExternalSocketIOServer().emitToPersistent(deviceId, 'unpairDevice')
  });

  socket.on('removeGSmsDevice', async (storeId, deviceId, callback = () => null) => {
    if (!storeId || !deviceId) return callback(new Error('no storeId/deviceId'));

    try {
      const {name, settingName, alias} = await cms.getModel('Store').findOne({id: storeId})
      await cms.getModel('Store').findOneAndUpdate({id: storeId}, {
        $pull: {
          'gSms.devices': {_id: deviceId}
        }
      });

      const targetClientId = `${storeId}_${deviceId}`;
      await getExternalSocketIOServer().emitToPersistent(targetClientId, 'unregister');
      console.debug(`sentry:clientId=${targetClientId},store=${name || settingName},alias=${alias},eventType=pair`,
        `Online order: Emit event: unpair demo client ${targetClientId}, socket id = ${socket.id}`);
      cms.socket.emit('loadStore', storeId);
      callback();
    } catch (e) {
      console.log(e);
      callback(e);
    }
  });
}

module.exports = createDeviceEventListeners;
