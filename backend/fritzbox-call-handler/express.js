// TODO: modify later, when installed on customer's tablet proxy server won't be used
module.exports = cms => {
  const express = require('express');
  const router = express.Router();
  const {ProxyClient} = require('@gigasource/nodejs-proxy-server');

  const PORT = global.APP_CONFIG.port || 8888;

  router.post('/ring', (req, res) => {
    const callInfo = req.body;

    cms.socket.emit('receiving-call', callInfo.caller, new Date());
    console.log(callInfo);

    res.status(204).send();
  });

  router.get('/test', (req, res) => res.status(200).send('ok'));

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
