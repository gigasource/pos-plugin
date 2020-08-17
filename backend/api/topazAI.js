const express = require('express')
const router = express.Router()
const axios = require('axios')
const FormData = require('form-data')
const {getHost} = require('./utils')
const http = require('http')
const https = require('https')
const path = require('path')
const TAG = '/topaz'

function createResponder(taskId, res) {
  return {
    success: (data) => {
      console.debug(TAG, `TopazAI: Task "${taskId}" completed!`)
      res.json({ success: true, data })
    },
    fail: (error) => {
      console.debug(TAG, `TopazAI: Task "${taskId}", failed with error "${error}"!`)
      res.json({ success: false, error })
    }
  }
}

router.post('/', async (req, _res) => {
  if (process.env.USE_TOPAZ_SERVICE !== "true") {
    _res.json({success: false, error: 'Topaz AI Service is not enabled'})
    return
  }

  const topazServiceUrl = process.env.TOPAZ_SERVICE_ENDPOINT
  const host = getHost(req)
  const {url} = req.body
  if (url) {
    // post request, get taskid response then wait
    console.debug(TAG, `TopazAI: service endpoint = "${topazServiceUrl}", url="${url}"`)
    const { taskId } = (await axios.post(`${topazServiceUrl}/task`, { imageUrls: [ url ] })).data
    console.debug(TAG, `TopazAI: Adjust image with taskId="${taskId}"`)

    const { success, fail } = createResponder(taskId, _res)
    const checkInterval = 1000
    let timeout = 60 // seconds
    const intervalId = setInterval(async () => {
      timeout--;
      const data = (await axios.get(`${topazServiceUrl}/task/${taskId}`)).data;
      if (timeout <= 0) {
        console.debug(TAG, `TopazAI: Task "${taskId}" timeout!`)
        clearInterval(intervalId);
      }
      else if (data.status === 'failed') {
        clearInterval(intervalId)
        fail(result.error)
      }
      else if (data.status === 'completed') {
        console.debug(TAG, `Task "${taskId}" completed!` )
        clearInterval(intervalId)
        try {
          // download processed file then upload to file server
          const protocol = topazServiceUrl.startsWith("https") ? https : http
          protocol.get(`${topazServiceUrl}${data.path}`, async response => {
            const formData = new FormData()
            formData.append("file", response, { filename: path.basename(data.path), contentType: 'image/jpeg' })
            axios.post(`${host}/cms-files/files?folderPath=/images`, formData, { headers: formData.getHeaders() }).then(async res => {
              if (res.data[0].uploadSuccess) {
                try {
                  console.debug(TAG, `Task "${taskId}" adjusted image upload completed.`)
                  const file = res.data[0].createdFile
                  const newImagePath = `/cms-files/files/view${file.folderPath}${file.fileName}`
                  success(newImagePath)
                } catch (ie) {
                  fail(ie)
                }
              } else {
                fail("Image upload failed")
              }
            }).catch(fail)
          })
        } catch (e) {
          fail(e)
        }
      }
    }, checkInterval)
  }
})

module.exports = router
