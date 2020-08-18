module.exports = cms => {
  cms.post(`init-schema:Store`, {}, schema => {
    schema.index({location: '2dsphere'});
  });
}
