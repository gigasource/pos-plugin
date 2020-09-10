const express = require('express')
const router = express.Router()
const { getTask, getTasks, createNewTask, updateTask } = require('./task')

/**
 * Return all tasks of specified store if storeId is passing in query
 * Return specified task if taskId is passing in query
 * If both storeId and TaskId are passing in query, taskId will be prefer.
 */
router.get('/', async (req, res) => {
  const { storeId, startDate, endDate, taskId } = req.query
  try {
    if (taskId) {
      res.json(await getTask({taskId}))
    } else if (storeId) {
      res.json(await getTasks({storeId, startDate, endDate}))
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
    const updateResult = await updateTask({...req.body})
    res.json(updateResult)
  } catch (e) {
    res.json({error: e.message})
  }
})

module.exports = router