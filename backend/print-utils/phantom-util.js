const queue = require('queue');
const q = require('q');
const fs = require('fs');
const PNG = require('pngjs').PNG;
//const phantom = require('phantom');
let instance, page;

async function initPhantom() {
  if (fs.existsSync(global.phantomPath)) {
    instance = await phantom.create([], {
      phantomPath: global.phantomPath,
      logLevel: 'error'
    });
  } else {
    instance = await phantom.create();
  }

  page = await instance.createPage();

  await page.property('viewportSize', {width: 560, height: 100});
}

let renderQueue = queue({autostart: true, concurrency: 1});

module.exports = class PhantomUtil {
  constructor() {
    renderQueue.push(next => initPhantom().then(next));
    //initPhantom();
  }

  render(html) {
    return new Promise((resolve, reject) => {
      renderQueue.push(next => (async function () {
        try {
          await page.setContent(html, `http://localhost/`);
          //yield * injectPage();
          let pngBase64 = await page.invokeMethod('renderBase64', 'PNG');
          const png = PNG.sync.read(Buffer.from(pngBase64, 'base64'));

          // write png for debugging/previewing
          // fs.writeFile(`${__dirname}/test.png`, pngBase64, 'base64', console.log);
          resolve(png);
        } catch (e) {
          reject(e);
        }
        next()
      })())
    })
  }
}
