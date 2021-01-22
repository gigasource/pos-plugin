module.exports = (cms) => {

  console.log('register modifier schema')
  const { orm } = cms
  // Register manually modifiers instead of using buildform
  const schema = require('./modifierSchema.json')
  orm.registerSchema('Modifiers', schema)
  cms.Types['Modifiers'] = {
    schema,
    name: 'Modifiers',
    Model: orm('Modifiers'),
    info: {}
  }
}
