const express = require('express')
const router = express.Router()

router.post('/meta-data', async (req, res) => {
  try {
    const {uploadPath, version, type, note, group, base, release, osName} = req.body
    let app = await cms.getModel('App').findOne({name: group})
    if (!app)
      app = await cms.getModel('App').create({ name: group })
    await cms.getModel('AppItem').create({ version, type, changeLog: note, uploadPath, uploadDate: new Date(), app: app._id, baseVersion: base, release, osName })
    res.json({ok: true})
  } catch (e) {
    res.json({error: e})
  }
})

module.exports = router
