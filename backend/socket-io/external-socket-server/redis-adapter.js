const redisAdapter = require('socket.io-redis');

const {getInternalSocketIOServer} = require('../internal-socket-server');

const SOCKET_IO_REDIS_SYNC_INTERVAL = 60 * 1000;
const {WATCH_DEVICE_STATUS_ROOM_PREFIX} = require('../constants');

// NOTE: p2p server plugin must be applied for externalSocketIOServer before calling this
function applyRedisAdapter(externalSocketIOServer) {
  const Redis = require("ioredis");
  const {hosts, password} = global.APP_CONFIG.redis;
  const startupRedisNodes = hosts.split(',').map(host => {
    const hostInfoArr = host.split(':');
    return {
      host: hostInfoArr[0],
      port: hostInfoArr[1],
    }
  });

  const ioredisOpt = {
    redisOptions: {password}
  };

  externalSocketIOServer.adapter(redisAdapter({
    pubClient: new Redis.Cluster(startupRedisNodes, ioredisOpt),
    subClient: new Redis.Cluster(startupRedisNodes, ioredisOpt),
  }));

  setInterval(() => {
    const internalSocketIOServer = getInternalSocketIOServer();

    externalSocketIOServer.syncClientList().then(updatedClientIdList => {
        updatedClientIdList.forEach(clientId =>
          internalSocketIOServer.to(`${WATCH_DEVICE_STATUS_ROOM_PREFIX}${clientId}`).emit('updateDeviceStatus', clientId));
      });

  }, SOCKET_IO_REDIS_SYNC_INTERVAL);
}

module.exports = {
  applyRedisAdapter,
}
