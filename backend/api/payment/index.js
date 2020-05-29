const express = require('express')
const router = express.Router()
const paypal = require('./paypal')

router.use('/paypal', paypal)

module.exports = router
