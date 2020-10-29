const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const https = require('https')

// domain: 'http://localhost:8888'
// apiBaseUrl: '/cms-files'
module.exports = function uploader({ domain, apiBaseUrl }) {
  const uploadFileUrl = `${domain}${apiBaseUrl}/files?folderPath=`
  const appMetaDataUrl = `${domain}/app/meta-data`
  const uploadPath = `/update/POS_Android`
  // `https://pos.gigasource.io/cms-files/file-existed?filePath=/update/POS_Android/${version}`
  // grid-fs handler methods
  async function isFolderExist(folderPath) {
    try {
      const response = (await axios.get(`${domain}${apiBaseUrl}/file-existed?filePath=${folderPath}`))
      return (response && response.data && response.data.existed);
    } catch (err) {
      return false
    }
  }

  async function createNewFolder(folderPath, newFolderName = 'New Folder') {
    await axios.post(`${domain}${apiBaseUrl}/folders`, {
      folderName: newFolderName,
      folderPath: folderPath,
    })
  }

  function _getDownloadUrl(file) {
    return `${apiBaseUrl}/files/download/${file.folderPath}${file.fileName}`
  }

  async function createFolder(parentPath, folderPath) {
    const separator = parentPath.endsWith('/') ? '' : '/'
    const folderExist = await isFolderExist(`${parentPath}${separator}${folderPath}`)
    if (!folderExist) await createNewFolder(parentPath, folderPath)
  }

  async function prepareUploadAppFolder(version) {
    await createFolder('/update', 'POS_Android');

    console.log(`creating ${uploadPath}/${version} folder`)
    await createFolder(uploadPath, version)
  }

  return async function uploadApp({ filePath, group, version, type, base, release, note, osName  }) {
    if (!fs.existsSync(filePath)) return
    const fileName = path.parse(filePath).base

    // prepare
    if (type == 'PATCH') {
      await prepareUploadAppFolder(version)
    }

    // upload file to file-explorer
    const folderPath = `${uploadPath}/${version}`;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    let response
    try {
      response = await axios.post(`${uploadFileUrl}${folderPath}&overwrite=true`, form, {
        maxContentLength: 1024 * 1024 * 1024,
        httpsAgent: new https.Agent({rejectUnauthorized: false}),
        headers: {...form.getHeaders()}
      });
    } catch (err) {
      console.log(`Upload ${filePath} error`)
      if (err.response) {
        console.log(err.response.data);
        console.log(err.response.code);
      }
    }
    if (!response.data[0].uploadSuccess)
      return;
    const file = response.data[0].createdFile;
    const downloadPath = _getDownloadUrl(file);

    // upload app meta-data
    let response2
    try {
      response2 = await axios.post(appMetaDataUrl, {
        uploadPath: downloadPath,
        version,
        type,
        note,
        group,
        base,
        release,
        osName
      })
    } catch (err) {
      console.log('Upload metadata error');
      if (err.response) {
        console.log(err.response.data);
        console.log(err.response.code);
      }
    }
    return response2.data
  }
}

// usage
// const uploadApp = uploader({ domain: 'http://localhost:8888', apiBaseUrl: '/cms-files' })
// uploadApp({
//   filePath: './ps.7zip.apk',
//   group: 'POS_Android',
//   version: '1.0.1',
//   type: 'PATCH', // or APK
//   base: '1.0.0',
//   release: 'Stable', // or Beta or Archived
//   note: 'Bugs fixed'
// });
