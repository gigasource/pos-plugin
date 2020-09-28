const TASK_COL = 'Task';
const _ = require('lodash');

/**
 * Return all task of specified store in specified completed/cancelled time date range in specified status
 * @param storeId
 * @param statuses in ['inprogress', 'completed', 'cancelled', 'base']
 * @param startDate
 * @param endDate
 * @param staffId
 * @returns {Promise<*>}
 */
async function getTasks({storeId, statuses, startDate, endDate, staffId}) {
  if (!storeId)
    throw "Missing store's id"
  const qryCondition = { store: storeId }
  if (statuses) {
    Object.assign(qryCondition, {status: {$in: Array.isArray(statuses) ? statuses : [statuses]}})
  } else {
    Object.assign(qryCondition, {status: {$ne: 'base'}})
  }
  if (startDate && endDate) {
    Object.assign(qryCondition, {
      $or: [
        { $and: [{ completedTime: { $gte: startDate }}, { completedTime: { $lte: endDate }}]},
        { $and: [{ cancelledTime: { $gte: startDate }}, { cancelledTime: { $lte: endDate }}]},
        // { cancelledTime: { $exists: false }, completedTime: { $exists: false }},
        { $and: [{ deadline: { $gte: startDate }}, { deadline: { $lte: endDate }}]},
        { cancelledTime: { $exists: false }, completedTime: { $exists: false }},
      ]
    })
  }

  if(staffId) {
    Object.assign(qryCondition, {
      participants: {
        $elemMatch: {
          $eq: staffId
        }
      }
    })
  }
  const tasks = await cms.getModel(TASK_COL).find(qryCondition)
  return tasks.map(t => ({...t._doc, participants: t._doc.participants.filter(p => p.active)}))
  // return tasks
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
 * @param {ObjectId} storeId
 * @param {String} name
 * @param {Date} deadline
 * @param {String} status: 'inprogress' || 'completed' || 'cancelled'
 * @param {String} note
 * @param {Array<ObjectId>} participants staff's id
 * @param {String} repeat: one time task or repeating task (daily, weekly, monthly).
 * @param {String} location TODO: update doc
 */
async function createNewTask({ storeId, name, deadline, status, note, participants, repeat, location }) {
  if (!storeId)
    throw "Missing store's id"

  //creating base task if repeat
  let baseTask
  if(repeat !== 'none') {
    baseTask = await cms.getModel(TASK_COL).create({
      name,
      deadline,
      status: 'base',
      note,
      participants,
      repeat,
      location,
      store: storeId,
    })
  }

  const createdTask = await cms.getModel(TASK_COL).create({
    name,
    deadline,
    status,
    note,
    participants,
    repeat,
    location,
    store: storeId,
    base: baseTask && baseTask._id
  })
  cms.emit('notifyAssignedStaffs', createdTask)

  return createdTask;
}

/**
 *
 * @param {ObjectId} taskId task's id
 * @param {String} name task's name
 * @param {String | Date} deadline task's deadline
 * @param {String} status task's status: 'inprogress' || 'completed || 'late'
 * @param {String} note task's note
 * @param {Array<ObjectId>} participants staff's id
 * @param {String} repeat indicate this is repeatable task or one time task.
 * @param {String} location TODO: update doc
 * @param completedBy
 * @param completedTime
 * @param cancelledBy
 * @param cancelledTime
 */
async function updateTask({ taskId, name, deadline, status, note, participants, repeat, location, completedBy, completedTime, cancelledBy, cancelledTime  }) {
  if (!taskId)
    throw "Missing task's id";
  const task = await cms.getModel(TASK_COL).findOne({_id: taskId}).lean()
  let diffParticipants = []
  const changes = {}
  if (name) changes.name = name
  if (deadline) changes.deadline = deadline
  if (status) changes.status = status
  if (note) changes.note = note // allow empty note
  if (participants) {
    changes.participants = participants
    diffParticipants = _.without(changes.participants.map(p => typeof p === 'string' ? p : p._id), ...task.participants.map(p => p._id.toString()))
  }
  if (location) changes.location = location
  if (completedBy) changes.completedBy = completedBy
  if (completedTime) changes.completedTime = completedTime
  if (cancelledBy) changes.cancelledBy = cancelledBy
  if (cancelledTime) changes.cancelledTime = cancelledTime
  if (repeat) {
    changes.repeat = repeat
    if (task.repeat !== repeat) {
      if(task.repeat === 'none') {
        // update from no-repeat to repeat task
        const baseTask = Object.assign({}, task, changes)
        delete baseTask._id
        const base = await cms.getModel(TASK_COL).create({
          ...baseTask,
          status: 'base'
        })
        changes.base = base._id
      } else if (repeat === 'none') {
        // update from repeat to no-repeat task
        changes.base = ''
        await cms.getModel(TASK_COL).deleteOne({_id: task.base})
      }
    }
    if(task.base && repeat !== 'none') {
      await cms.getModel(TASK_COL).findOneAndUpdate({ _id: task.base }, changes)
    }
  }
  const response = await cms.getModel(TASK_COL).findOneAndUpdate({ _id: taskId }, changes,  { "new": true })
  if (diffParticipants.length > 0) cms.emit('notifyAssignedStaffs', {...response, participants: diffParticipants})
  if (completedBy) cms.emit('updateTask', {task: response, type: 'completed'})
  else if (cancelledBy) cms.emit('updateTask', {task: response, type: 'cancelled'})
  else cms.emit('updateTask', {task: response, type: 'updated'})
  return response._doc
}

async function removeTask(taskId) {
  if(!taskId)
    throw "Missing task's id";
  return await cms.getModel(TASK_COL).deleteOne({_id: taskId})
}

module.exports = {
  getTasks,
  getTask,
  createNewTask,
  updateTask,
  removeTask
}
