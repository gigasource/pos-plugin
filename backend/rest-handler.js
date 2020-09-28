module.exports = cms => {
  // TODO: delete this after testing with Fritzbox is done
  const fritzboxHandlers = require('./fritzbox-call-handler/express')(cms);
  cms.app.use('/fritzbox-events', fritzboxHandlers);

  cms.app.use(/^\/$/, async (req, res) => {
    return res.redirect('/pos-login');
  });
}
