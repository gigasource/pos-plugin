const { route } = require('../store');

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

router.put('/update-token/:id', async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;
  if (!id) return res.status(400).json({ error: `Id can not be ${id}` });
  try {
    await UserModel.findByIdAndUpdate(id, {firebaseToken: token});
    res.status(200).json({token: token});
  } catch (e) {
    res.status(500).json({error: 'Error updating device token'});
  }
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const user = await UserModel.findOne({username, active: true});
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      storeGroups: user.storeGroups
    });
  } else {
    res.status(404).json({error: 'User not found'});
  }
});
module.exports = router;
