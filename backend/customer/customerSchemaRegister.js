module.exports = (cms) => {
  console.log('register customer schema')
  const { orm } = cms
  const schema = require('./customer-schema.json')
  orm.registerSchema('Customer', schema)
  cms.Types['Customer'] = {
    schema,
    name: 'Customer',
    Model: orm('Customer'),
    info: {}
  }
}
