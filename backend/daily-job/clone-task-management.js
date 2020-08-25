const dayjs = require('dayjs')
const _ = require('lodash')

const DAILY = 'opd', WEEKLY = 'opw', MONTHLY = 'opm', INPROGRESS = 'inprogress';

async function cloneTask() {
  let cloneTasks = []
  const baseTasks = await cms.getModel('Task').find({
    status: 'base',
    repeat: {$ne: 'none'}
  })
  const groupedByRepeat = _.groupBy(baseTasks, 'repeat')
  const today = dayjs()
  //clone daily tasks
  for (const task of groupedByRepeat[DAILY]) {
    const baseDeadline = task.deadline && dayjs(task.deadline)
    cloneTasks.push({
      ..._.omit(task, '_id'),
      base: task._id,
      status: INPROGRESS,
      deadline: task.deadline && today.hour(baseDeadline.hour()).minute(baseDeadline.minute()).second(0).toDate()
    })
  }
  //clone weekly tasks if today = monday
  const monday = dayjs().startOf('week').add(1, 'day')
  if(today.diff(monday, 'day') === 0) {
    for (const task of groupedByRepeat[WEEKLY]) {
      const baseDeadline = task.deadline ? dayjs(task.deadline) : dayjs()
      if (dayjs().diff(baseDeadline, 'day') >= 0) { //only clone old task to new one
        cloneTasks.push({
          ..._.omit(task, '_id'),
          base: task._id,
          status: INPROGRESS,
          deadline: task.deadline && baseDeadline.add(Math.round(monday.diff(baseDeadline, 'day')/7) * 7, 'day').toDate()
        })
      }
    }
  }
  //clone monthly tasks if today = 1st
  const firstDayOfMonth = dayjs().startOf('month')
  if(today.diff(firstDayOfMonth, 'day') === 0) {
    for (const task of groupedByRepeat[MONTHLY]) {
      const baseDeadline = task.deadline ? dayjs(task.deadline) : dayjs()
      if (dayjs().diff(baseDeadline, 'day') >= 0) { //only clone old task to new one
        cloneTasks.push({
          ..._.omit(task, '_id'),
          base: task._id,
          status: INPROGRESS,
          deadline: baseDeadline.add(Math.round(firstDayOfMonth.diff(baseDeadline, 'month')), 'month').toDate()
        })
      }
    }
  }
  await cms.getModel('Task').create(cloneTasks)
}

module.exports = cloneTask
