const TASK_COL = 'Task'

/**
 * Return all task of specified store in specified deadline date range
 * @param storeId
 * @param startDate
 * @param endDate
 * @returns {Promise<*>}
 */
async function getTasks({storeId, startDate, endDate}) {
  if (!storeId)
    throw "Missing store's id"
  const qryCondition = { store: storeId, $or: [ { deadline: 'none' } ] }
  if (startDate && endDate) {
    qryCondition.$or.push( { $and: [ { deadline: { $gte: startDate }}, { deadline: { $lte: endDate } }  ]  })
  }
  return await cms.getModel(TASK_COL).find({store: storeId})
}

/**
 * Return task from taskId
 * @param taskId
 * @returns {Promise<*>}
 */
async function getTask({taskId}) {
  if (!taskId)
    throw "Missing task's id"
  return await cms.getModel(TASK_COL).find({_id: taskId})
}

/**
 *
 * @param {ObjectId} storeId store's id
 * @param {String} name task's name
 * @param {String | Date} deadline task's deadline
 * @param {String} status task's status: 'inprogress' || 'completed
 * @param {String} note task's note
 * @param {Array<ObjectId>} pariticipants staff's id
 * @param {Boolean} repeat indicate this is repeatable task or one time task.
 * @param {String} location TODO: update doc
 */
async function createNewTask({ storeId, name, deadline, status, note, pariticipants, repeat, location }) {
  if (!store)
    throw "Missing store's id"

  const task = await cms.getModel(TASK_COL).findOne({ name, store: storeId })
  if (task)
    throw `Task with name "${name}" already exist.`

  return await cms.getModel(TASK_COL).create({
    name,
    deadline,
    status,
    note,
    pariticipants,
    repeat,
    location,
    store: storeId
  })
}

/**
 *
 * @param {ObjectId} taskId task's id
 * @param {String} name task's name
 * @param {String | Date} deadline task's deadline
 * @param {String} status task's status: 'inprogress' || 'completed || 'late'
 * @param {String} note task's note
 * @param {Array<ObjectId>} pariticipants staff's id
 * @param {Boolean} repeat indicate this is repeatable task or one time task.
 * @param {String} location TODO: update doc
 */
async function updateTask({ taskId, name, deadline, status, note, pariticipants, repeat, location }) {
  if (!taskId)
    throw "Missing task's id";
  const changes = {}
  if (name) changes.name = name
  if (deadline) changes.deadline = deadline
  if (status) changes.status = status
  if (note != null) changes.note = note // allow empty note
  if (pariticipants != null) changes.pariticipants = pariticipants
  if (repeat != null && repeat !== changes.repeat) changes.repeat = repeat
  if (location) changes.location = location
  return cms.getModel(TASK_COL).updateOne({ _id: taskId }, changes, { new: true })
}

module.exports = {
  getTasks,
  getTask,
  createNewTask,
  updateTask
}
