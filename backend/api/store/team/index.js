const express = require('express')
const router = express.Router()
const { createTeam, getTeam, removeTeam, updateTeam } = require('./team');

/**
 * Get teams
 */
router.get('/:storeId', async (req, res) => {
  try {
    res.json(await getTeam({...req.params}))
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Create team
 */
router.post('/', async (req, res) => {
  try {
    res.json(await createTeam({...req.body}))
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Update team
 */
router.put('/', async(req, res) => {
  try {
    res.json(await updateTeam({...req.body}))
  } catch (e) {
    res.json({error: e.message})
  }
})

router.delete('/:teamId', async (req, res) => {
  try {
    res.json(await removeTeam({...req.params}))
  } catch (e) {
    res.json({error: e.message})
  }
})

module.exports = router
