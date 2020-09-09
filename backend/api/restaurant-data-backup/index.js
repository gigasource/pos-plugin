const express = require('express');
const router = express.Router();
const pwdGenerator = require('generate-password');
const {createReadWriteUser} = require('./db-handler');

router.get('/backup-db-host', (req, res) => {
  const {host} = global.APP_CONFIG.backupDatabaseConfig;
  res.status(200).json({host});
});

router.post('/backup-db-users', async (req, res) => {
  const {dbName} = req.body;
  if (!dbName) res.status(400).json({error: `missing dbName in request body`})

  const newUsername = 'sync-db-user';
  const newRandomPwd = pwdGenerator.generate({
    length: 32,
    numbers: true,
  });

  await createReadWriteUser(dbName, newUsername, newRandomPwd);
  res.status(200).json({
    db: dbName,
    username: newUsername,
    password: newRandomPwd,
  });
});

module.exports = router;
