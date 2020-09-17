module.exports = cms => {
  // TODO: modify later, when installed on customer's tablet proxy server won't be used
  const fritzboxHandlers = require('./fritzbox-call-handler/express')(cms);
  cms.app.use('/fritzbox-events', fritzboxHandlers);

  cms.app.use(/^\/$/, async (req, res, next) => {
    return res.redirect('/pos-login');
    next();
  });
}
