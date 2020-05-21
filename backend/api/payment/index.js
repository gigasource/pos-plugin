const express = require('express')
const router = express.Router()
const paypal = require('./paypal')
const klanar = require('./klanar')

router.use('/paypal', paypal)
router.use('/klanar', klanar)

module.exports = router
