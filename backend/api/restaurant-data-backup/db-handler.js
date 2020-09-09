const {MongoClient} = require('mongodb');

const connnectionUri = 'mongodb://username:password@mongo-vn-office.gigasource.io:27017/admin?replicaSet=rs0';
let client;

async function createDbClient() {
  if (!client) client = await MongoClient.connect(connnectionUri);

  return client;
}

async function createReadWriteUser(databaseName, username, password) {
  const dbClient = await createDbClient();
  const db = dbClient.db(databaseName);

  await db.command({
    createUser: username,
    pwd: password,
    roles: [{role: 'readWrite', db: databaseName}],
  });

  return {databaseName, username, password};
}

module.exports = {
  createReadWriteUser,
}
