module.exports = async (cms) => {
  const collectionNames = [
    'CmsPlugin',
    'BuildForm',
    'ComponentBuilder',
    'Config',
    'SystemConfig',
    'ProcessData',
    'GroupPrinter',
    'EndOfDay',
    'Feature',
    'Category',
    'OrderLayout',
    'Avatar',
    'Room',
    'Product',
    'Order',
    'PosSetting',
    'Terminal',
    'Reservation',
    'SentrySavedMessage',
    'Session',
  ];

  const {applySyncMiddleware} = require('@gigasource/mongoose-sync');

  collectionNames.forEach(collectionName => {
    cms.post(`init-schema:${collectionName}`, schema => {
      applySyncMiddleware(schema, null, true);
    });
  });
}
