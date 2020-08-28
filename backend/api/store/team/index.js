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
  const { team } = req.body
  try {
    res.json(await createTeam(team))
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Update team
 */
router.put('/', async(req, res) => {
  const { team } = req.body
  try {
    res.json(await updateTeam(team))
  } catch (e) {
    res.json({error: e.message})
  }
})

router.post('/remove', async (req, res) => {
  const { teamId } = req.body
  try {
    res.json(await removeTeam(teamId))
  } catch (e) {
    res.json({error: e.message})
  }
})

module.exports = router
