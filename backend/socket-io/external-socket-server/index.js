const {p2pServerPlugin} = require('@gigasource/socket.io-p2p-plugin');
const once = require('lodash/once');

const {updateMessage, saveMessage, deleteMessage, loadMessages} = require('./persistent-messages');
const {applyRedisAdapter} = require('./redis-adapter');
const {SentrySavedMessagesModel} = require('./sentry-saved-messages');

let externalSocketIOServer;

function createExternalSocketIOServer(cms) {
  const {io} = cms;

  externalSocketIOServer = p2pServerPlugin(io, {
    clientOverwrite: true,
    redisClusterEnabled: true,
    saveMessage,
    loadMessages,
    deleteMessage,
    updateMessage,
  });

  if (global.APP_CONFIG.redis) applyRedisAdapter(externalSocketIOServer);

  process.on('SIGINT', once(async () => {
    const connectedSockets = externalSocketIOServer.sockets.connected;

    await Promise.all(Object.keys(connectedSockets).map(async socketId => {
      const socket = connectedSockets[socketId];
      const {clientId} = socket;

      // Store Sentry logs in DB to make sure logs are sent (will be sent on next server's startup)
      if (clientId) return await SentrySavedMessagesModel.create({
        tagString: `sentry:clientId=${clientId},eventType=socketConnection,socketId=${socketId}`,
        message: `2a. (Startup) Client ${clientId} disconnected, socket id = ${socketId}`,
      });
    }));

    if (global.APP_CONFIG.redis) {
      // Remove all socket clients belonging to this instance stored in Redis when this instance exits/be killed
      await externalSocketIOServer.removeInstanceClients();
    }

    setTimeout(() => process.exit(), 3000);
  }));

  externalSocketIOServer.onLibLog((msg, extraInfo) => {
    let sentryTagString = 'sentry:lib=p2p-Socket.io,eventType=socketConnection';
    if (typeof extraInfo === 'object') Object.keys(extraInfo).forEach(key => sentryTagString += `,${key}=${extraInfo[key]}`);

    console.debug(sentryTagString, msg);
  });

  externalSocketIOServer.on('connect', (socket) => {
    const clientId = socket.request._query && socket.request._query.clientId;
    const demoMode = socket.request._query && socket.request._query.demo;

    if (clientId) {
      if (!demoMode) {

      } else {

      }
    }
  });
}

function getExternalSocketIOServer() {
  return externalSocketIOServer;
}

module.exports = {
  createExternalSocketIOServer,
  getExternalSocketIOServer,
}
