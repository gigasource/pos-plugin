const express = require('express')
const router = express.Router()
const { getTask, getTasks, createNewTask, updateTask, removeTask } = require('./task')

/**
 * Return all tasks of specified store if storeId is passing in query
 * Return specified task if taskId is passing in query
 * If both storeId and TaskId are passing in query, taskId will be prefer.
 */
router.get('/', async (req, res) => {
  const { storeId, statuses,  startDate, endDate, staffId, taskId } = req.query
  try {
    if (taskId) {
      res.json(await getTask({taskId}))
    } else if (storeId) {
      res.json(await getTasks({storeId, statuses, startDate, endDate, staffId}))
    }  else {
      res.json({error: "Missing both store's id and task's id" })
    }
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Create new task
 */
router.post('/', async (req, res) => {
  try {
    const insertResult = await createNewTask({ ...req.body })
    res.json(insertResult)
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Update task:
 * - rename
 * - add/remove participants
 * - add note
 * - add deadline
 * - change task repeat <-> one time
 * - change task location
 * - allow mask task as completed
 */
router.put('/', async (req, res) => {
  try {
    const task = req.body
    const updateResult = await updateTask(task)
    res.json(updateResult)
  } catch (e) {
    res.json({error: e.message})
  }
})

// Remove task
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    if (taskId) {
      const response = await removeTask(taskId)
      res.json(response)
    } else {
      res.json({ error: 'Missing taskId' })
    }
  } catch (e) {
    res.json({ error: e.message })
  }
})

// Remove task
/**
 * @Obsolete
 */
router.post('/remove', async (req, res) => {
  try {
    const { taskId } = req.body
    const response = await removeTask(taskId)
    res.json(response)
  } catch (e) {
    res.json({ error: e.message })
  }
})

module.exports = router
