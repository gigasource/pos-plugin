async function getTeam({storeId}) {
  if (!storeId)
    throw "Missing store's id"

  const teams = await cms.getModel('Team').find({store: storeId})
  return teams.map(t => ({...t._doc, members: t._doc.members.filter(m => m.active)}))
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

async function removeTeam(teamId) {
  if (!teamId)
    throw "Missing team's id"
  // TODO: Adding permission check to prevent malicious remove request
  return await cms.getModel('Team').deleteOne({_id: teamId})
}

module.exports = {
  getTeam,
  createTeam,
  updateTeam,
  removeTeam
}
