async function getStaff({storeId}) {
  if (!storeId)
    throw "Missing store's id"
  return await cms.getModel('Staff').find({store: storeId})
}

async function createStaff({ name, role, avatarUrl, active = true, storeId, deviceId }) {
  if (!storeId)
    throw "Missing store's id"

  if (!deviceId)
    throw "Missing device's id"

  return await cms.getModel('Staff').create({
    name,
    role,
    active,
    avatarUrl,
    store: storeId,
    device: deviceId
  })
}

async function updateStaff({ staffId, name, role, active, avatarUrl }) {
  if (!staffId)
    throw "Missing staff's id"

  const changes = {}
  if (name) changes.name = name
  if (role) changes.role = role
  if (active != null && active !== changes.active) changes.active = active
  if (avatarUrl !== changes.avatarUrl) changes.avatarUrl = avatarUrl // allow to remove avatar

  return await cms.getModel('Staff').update({_id: staffId}, changes, { new: true })
}

function removeStaff({ staffId }) {
  // not impl
}

async function processCheckInCheckOut({staffId, type, time, storeId}) {
  if (!storeId)
    throw "Missing store's id"
  if (!staffId)
    throw "Missing staff's id"
  if (type !== 'in' && type !== 'out')
    return "Invalid check type"
  // validate time??
  return await cms.getModel('CheckEvent').create({ staff: staffId, store: storeId, type, time })
}

function getWorkTimeReport({staffId, startDate, endDate}) {
  // TODO: impl
  return {
    totalAttendance: 25,
    totalHours: 168,
    missingClock: 0,
    gpsError: 4
  }
}

function getTimeSheetDetail({staffId, startDate, endDate}) {
  // TODO: impl
  return {

  }
}

module.exports = {
  getStaff,
  createStaff,
  updateStaff,
  removeStaff,
  processCheckInCheckOut,
  getWorkTimeReport,
  getTimeSheetDetail
}
