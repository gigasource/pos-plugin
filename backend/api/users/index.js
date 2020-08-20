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

router.get('/supporter', async (req, res) => {
  const users = await UserModel.find({active: true}, {_id: 1, name: 1, role: 1, permissions: 1});
  const supporters = users.filter(u => u.role.name === 'admin' || u.permissions.reduce((acc, p) => p.permission === 'ticket' ? !!p.value : acc, false))
                          .map(u => ({_id: u._id, name: u.name}));
  res.status(200).json(supporters);
});
module.exports = router;
