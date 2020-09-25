const axios = require('axios');

const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');
const ProductModel = cms.getModel('Product');

const {getExternalSocketIOServer} = require('../../external-socket-server');

async function getReviewInGoogleMap(placeId) {
  const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&fields=rating,review,user_ratings_total&key=${global.APP_CONFIG.mapsApiKey}`);
  const { result } = response.data;
  return result;
}

function createMiscellaneousEventListeners(socket) {
  let remoteControlDeviceId = null;

  socket.on('getProxyInfo', callback => callback({
    proxyUrlTemplate: global.APP_CONFIG.proxyUrlTemplate,
    proxyRetryInterval: global.APP_CONFIG.proxyRetryInterval,
  }));

  socket.on('updateAppFeature', async (deviceId, features, cb) => {
    const externalSocketIOServer = getExternalSocketIOServer();

    const device = await DeviceModel.findById(deviceId).lean();
    const store = await StoreModel.findById(device.storeId);
    let sentryTags = `sentry:clientId=${deviceId},eventType=updateAppFeature`;
    if (store) sentryTags += `,store=${store.settingName},alias=${store.alias}`;

    try {
      await externalSocketIOServer.emitToPersistent(deviceId, 'updateAppFeature', features,
        'updateAppFeatureAck', [device, features]);

      // send products info if delivery features is on
      if (features && features.delivery) {
        const products = await ProductModel.find({store: store._id});
        const data = {products};
        externalSocketIOServer.emitTo(deviceId, 'updateProducts', data);
      }

      console.debug(sentryTags, `2. Online Order backend: Sending feature update to client with id ${deviceId}`,
        JSON.stringify(features));

      cb(`Awaiting device feature update for ${device.name}(${device.hardware})`);
    } catch (e) {
      console.debug(sentryTags, `2. Online Order backend: Error while sending feature update to client with id ${deviceId}`,
        JSON.stringify(features));

      cb('Error emitting to device');
    }
  });

  socket.on('updateApp', async (deviceId, uploadPath, type) => {
    await getExternalSocketIOServer().emitToPersistent(deviceId, 'updateApp', [uploadPath, type]);
  })

  socket.on('startRemoteControl', async (deviceId, callback) => {
    const externalSocketIOServer = getExternalSocketIOServer();

    if (!deviceId) {
      callback(null);
    } else {
      let {proxyServerHost, proxyServerPort, proxyUrlTemplate} = global.APP_CONFIG;

      remoteControlDeviceId = deviceId;
      externalSocketIOServer.emitTo(deviceId, 'startRemoteControl', proxyServerHost, proxyServerPort, async () => {
        let error;

        try {
          const {proxyPort} = (await axios.post(`${proxyServerHost}:${proxyServerPort}/start-proxy?proxyClientId=${deviceId}-proxy-client`)).data;

          if (!proxyPort) {
            error = 'No port is available for proxying';
          } else {
            callback(proxyUrlTemplate, proxyPort);
          }
        } catch (e) {
          error = e;
        }

        if (error) {
          console.error(error);
          externalSocketIOServer.emitTo(deviceId, 'stopRemoteControl');
          callback(null);
        }
      });
    }
  });

  socket.on('stopRemoteControl', async deviceId => {
    if (!deviceId) return;

    const {proxyServerHost, proxyServerPort} = global.APP_CONFIG;
    await axios.delete(`${proxyServerHost}:${proxyServerPort}/stop-proxy?proxyClientId=${deviceId}-proxy-client`);

    getExternalSocketIOServer().emitTo(deviceId, 'stopRemoteControl', () => remoteControlDeviceId = null);
  });

  socket.on('startStream', async (deviceId) => {
    if (!deviceId) return;
    await getExternalSocketIOServer().emitToPersistent(deviceId, 'startStream');
  });

  socket.on('stopStream', async (deviceId) => {
    if (!deviceId) return;
    await getExternalSocketIOServer().emitToPersistent(deviceId, 'stopStream');
  });

  socket.on('getReviewInGoogleMap', async (placeId, callback) => {
    const result = await getReviewInGoogleMap(placeId);
    callback(result);
  });

  socket.once('disconnect', async () => {
    if (!remoteControlDeviceId) return;

    const {proxyServerHost, proxyServerPort} = global.APP_CONFIG;
    await axios.delete(`${proxyServerHost}:${proxyServerPort}/stop-proxy?proxyClientId=${remoteControlDeviceId}-proxy-client`);
    remoteControlDeviceId = null;
  });
}

module.export = createMiscellaneousEventListeners;
