// TODO: delete this after testing with Fritzbox is done
module.exports = cms => {
  const express = require('express');
  const router = express.Router();
  const {ProxyClient} = require('@gigasource/nodejs-proxy-server');

  const PORT = global.APP_CONFIG.port || 8888;

  const callMap = {};

  router.post('/ring', (req, res) => {
    const callInfo = req.body;
    const {connectionId, caller} = callInfo;
    callMap[connectionId] = {pickedUp: false, caller};

    cms.socket.emit('new-phone-call', callInfo.caller, new Date());
    res.status(204).send();
  });

  router.post('/pickup', (req, res) => {
    const callInfo = req.body;
    const {connectionId} = callInfo;
    if (callMap[connectionId]) callMap[connectionId].pickedUp = true;

    res.status(204).send();
  });

  router.post('/hangup', (req, res) => {
    const callInfo = req.body;
    const {connectionId} = callInfo;
    const callSession = callMap[connectionId];

    if (callSession && !callSession.pickedUp) {
      cms.socket.emit('new-missed-phone-call', callSession.caller, new Date());
      delete callMap[connectionId];
    }

    res.status(204).send();
  });

  new ProxyClient({
    clientId: `fritzbox-event-handler`,
    proxyServerHost: 'https://fritzbox-proxy.gigasource.io',
    socketIOPort: 443,
    remoteHost: 'localhost',
    remotePort: PORT,
    remoteSocketKeepAlive: true,
    onConnect: () => console.log('Proxy connected and running'),
  });

  return router;
}
