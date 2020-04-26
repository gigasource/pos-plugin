const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios')
const path = require('path')

// domain: 'http://localhost:8888'
// apiBaseUrl: '/cms-files'
module.exports = function uploader({ domain, apiBaseUrl }) {
  const uploadFileUrl = `${domain}${apiBaseUrl}/files?folderPath=`
  const appMetaDataUrl = `${domain}/app/meta-data`

  // grid-fs handler methods
  async function getFilesInPath(folderPath) {
    return (await axios.get(`${domain}${apiBaseUrl}/file-metadata?folderPath=${folderPath}`)).data
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

  // ------ end grid-fs file handler
  async function isFolderExist(folderPath) {
    try {
      await getFilesInPath(folderPath)
      return true
    } catch (e) {
      return false
    }
  }

  async function createFolder(parentPath, folderPath) {
    const separator = parentPath.endsWith('/') ? '' : '/'
    const folderExist = await isFolderExist(`${parentPath}${separator}${folderPath}`)
    if (!folderExist) await createNewFolder(parentPath, folderPath)
  }

  async function prepareUploadAppFolder(fileName, version) {
    const baseName = getBaseName(fileName)
    console.log(`creating /update/${baseName} folder`)
    await createFolder('/update', baseName)

    console.log(`creating /update/${baseName}/${version} folder`)
    await createFolder(`/update/${baseName}`, version)
  }

  function getBaseName(fileName) {
    return fileName.substr(0, fileName.lastIndexOf('.'))
  }

  return async function uploadApp({ filePath, group, version, type, base, release, note  }) {
    if (!fs.existsSync(filePath)) return
    const fileName = path.parse(filePath).base

    // prepare
    await prepareUploadAppFolder(fileName, version)

    // upload file to file-explorer
    const folderPath = `/update/${getBaseName(fileName)}/${version}`;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    const response = await axios.post(`${uploadFileUrl}${folderPath}`, form, { headers: { ...form.getHeaders() } });
    if (!response.data[0].uploadSuccess)
      return;
    const file = response.data[0].createdFile;
    const uploadPath = _getDownloadUrl(file);

    // upload app meta-data
    const response2 = await axios.post(appMetaDataUrl, { uploadPath, version, type, note, group, base, release })
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
