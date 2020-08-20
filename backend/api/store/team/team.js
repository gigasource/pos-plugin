async function getTeam({storeId}) {
  if (!storeId)
    throw "Misisng store's id"

  return await cms.getModel('Team').find({store: storeId})
}

async function createTeam({name, members = [], storeId}) {
  if (!storeId)
    throw "Missing store's id"

  const team = await cms.getModel('Team').findOne({store: storeId, name})
  if (team)
    throw `Team with name "${name}" already exist!`

  return await cms.getModel('Team').create({name, members, store: storeId})
}

async function updateTeam({teamId, name, members = []}) {
  if (!teamId)
    throw "Missing team's id"
  const changes = {}
  if (name) changes.name = name
  if (members.length > 0) changes.members = members
  return await cms.getModel('Team').updateOne({ _id: teamId }, changes)
}

async function removeTeam({teamId}) {
  if (!teamId)
    throw "Missing team's id"
  // TODO: Adding permission check to prevent malicious remove request
  return await cms.getModel('Team').delete({_id: teamId})
}

module.exports = {
  getTeam,
  createTeam,
  updateTeam,
  removeTeam
}
