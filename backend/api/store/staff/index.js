const express = require('express')
const router = express.Router()

const {
  createStaff,
  getStaff,
  getStaffs,
  getTimeSheetDetail,
  getWorkTimeReport,
  processCheckInCheckOut,
  getLastCheckInCheckOut,
  removeStaff,
  updateStaff,
  getStaffsWithTask
} = require('./staff');

/**
 * get staff by device id and store id
 */
router.get('/', async (req, res) => {
  let {storeId, deviceId, storeUfId /* user-friendly id*/ } = req.query

  if (!storeId && storeUfId) {
    const store = await cms.getModel('Store').findOne({ id: storeUfId })
    if (store)
      storeId = store._id
  }

  try {
    const staff = await getStaff({storeId, deviceId})
    res.json(staff)
  } catch (e) {
    res.status(400).json({error: e.message})
  }
})

/**
 * get all staff of specified store
 */
router.get('/all-staffs/:storeId', async (req, res) => {
  try {
    res.json(await getStaffs({ storeId: req.params.storeId }))
  } catch (e) {
    res.status(400).json({error: e.message})
  }
})

/*
 * get all staff of a store with all current task
 */
router.get('/with-task/:storeId', async (req, res) => {
  const { storeId } = req.params
  try {
    res.json(await getStaffsWithTask(storeId))
  } catch (e) {
    res.status(400).json({error: e.message})
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
    res.status(400).json({error: e.message})
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
    res.status(400).json({error: e.message})
  }
})

router.delete('/:staffId', async (req, res) => {
  try {
    const removeResult = await removeStaff({staffId: req.params.staffId})
    res.json(removeResult)
  } catch (e) {
    res.status(400).json({error: e.message})
  }
})

/**
 * Process checkIn/checkOut
 */
router.post('/check-in-out', async (req, res) => {
  try {
    res.json(await processCheckInCheckOut({...req.body}))
  } catch (e) {
    res.status(400).json({error: e.message})
  }
})

/**
 * Get staff's last check in & check out
 */
router.get('/latest-check-event', async (req, res) => {
  try {
    res.json(await getLastCheckInCheckOut(req.query.staffId))
  } catch(e) {
    res.status(400).json({error: e.message})
  }
})

/**
 * Get staff work time report
 */
router.get('/work-time-report', async (req, res) => {
  try {
    res.json(await getWorkTimeReport({...req.query}))
  } catch (e) {
    res.status(400).json({error: e.message})
  }
})

/**
 * Get staff's timesheet
 */
router.get('/time-sheet-detail', async (req, res) => {
  try {
    res.json(await getTimeSheetDetail({...req.query}))
  } catch (e) {
    res.status(400).json({error: e.message})
  }
})

module.exports = router
