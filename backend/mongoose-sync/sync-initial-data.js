let initialized = false;
const axios = require('axios');

async function getWebShopUrl() {
  const posSetting = await cms.getModel('PosSetting').findOne();

  return posSetting.customServerUrl ? posSetting.customServerUrl : global.APP_CONFIG.webshopUrl;
}

async function getBackupDbHost() {
  const webshopUrl = await getWebShopUrl();
  const {data: {host}} = await axios.get(`${webshopUrl}/restaurant-data-backup/backup-db-host`);
  return host;
}

async function getBackupDbConnectionUri(dbName) {
  const PosSettingsModel = cms.getModel('PosSetting');
  const {backupDbCredentials} = await PosSettingsModel.findOne();
  const webshopUrl = await getWebShopUrl();
  let backupDbHost = await getBackupDbHost();
  let username, password;

  if (!backupDbCredentials || backupDbCredentials.host !== backupDbHost) {
    const {data} = await axios.post(`${webshopUrl}/restaurant-data-backup/backup-db-users`, {dbName});
    username = data.username;
    password = data.password;

    await PosSettingsModel.updateOne({}, {backupDbCredentials: {host: backupDbHost, username, password}});
  } else {
    backupDbHost = backupDbCredentials.host;
    username = backupDbCredentials.username;
    password = backupDbCredentials.password;
  }

  return `mongodb://${username}:${password}@${backupDbHost}/?replicaSet=rs0&authSource=${dbName}`;
}

async function initMongooseSync(dbName) {
  if (!dbName) throw new Error(`dbName can not be ${dbName}`);

  const backupFeatureEnabled = await cms.getModel('Feature').findOne({name: 'backupDatabase'});
  if (!backupFeatureEnabled || !backupFeatureEnabled.enabled) return;

  if (initialized) return;
  initialized = true;

  const {init} = require('@gigasource/mongoose-sync');
  const backupDbConnectionUri = await getBackupDbConnectionUri(dbName);
  const TaskModel = cms.getModel('MongooseSyncTask');

  const modelMap = Object.keys(cms.Types).reduce((acc, modelName) => {
    acc[modelName] = cms.Types[modelName].Model
    return acc;
  }, {});

  await init(backupDbConnectionUri, {
    dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    modelMap,
    taskModel: TaskModel,
  }, 5000);
  return true;
}

module.exports = {
  initMongooseSync,
}
