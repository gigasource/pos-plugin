const express = require('express')
const router = express.Router()

const {
  createStaff,
  getStaff,
  getTimeSheetDetail,
  getWorkTimeReport,
  processCheckInCheckOut,
  removeStaff,
  updateStaff
} = require('./staff');

/**
 * get all staff of specified store
 */
router.get('/:storeId', async (req, res) => {
  try {
    res.json(await getStaff({ storeId: req.params.storeId }))
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * create staff
 */
router.post('/', async (req, res) => {
  try {
    const insertResult = await createStaff({...req.body})
    res.json(insertResult)
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Update staff
 */
router.put('/', async (req, res) => {
  try {
    const updateResult = await updateStaff({...req.body})
    res.json(updateResult)
  } catch (e) {
    res.json({error: e.message})
  }
})

router.delete('/:staffId', async (req, res) => {
  try {
    const removeResult = await removeStaff({staffId: req.params.staffId})
    res.json(removeResult)
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Process checkIn/checkOut
 */
router.post('/check-in-out', async (req, res) => {
  try {
    res.json(await processCheckInCheckOut({...req.body}))
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Get staff work time report
 */
router.get('/work-time-report', async (req, res) => {
  try {
    res.json(await getWorkTimeReport({...req.body}))
  } catch (e) {
    res.json({error: e.message})
  }
})

/**
 * Get staff's timesheet
 */
router.get('/time-sheet-detail', async (req, res) => {
  try {
    res.json(await getTimeSheetDetail({...req.body}))
  } catch (e) {
    res.json({error: e.message})
  }
})

module.exports = router
