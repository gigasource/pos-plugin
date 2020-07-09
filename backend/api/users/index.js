const UserModel = cms.getModel('User');
const router = require('express').Router();

router.get('/username-mapping', async (req, res) => {
  let {userIds} = req.query;
  if (!userIds) res.status(400).json({error: `userIds query can not be ${userIds}`});

  const result = {};
  userIds = userIds.split(',');
  await Promise.all(userIds.map(async userId => {
    const user = await UserModel.findById(userId);
    result[userId] = user.name;
  }));

  res.status(200).json(result);
});

module.exports = router;
