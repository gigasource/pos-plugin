const axios = require('axios')
const version = require('../package.json').version
axios.get(`https://pos.gigasource.io/cms-files/file-existed?filePath=/update/POS_Android/${version}`).then(res => {
  console.log(res.data.existed);
  if (res.data.existed) {
    console.log("FAILED");
  }
})
