module.exports = cms => {
  cms.app.use(/^\/$/, async (req, res) => {
    return res.redirect('/pos-login');
  });
}
