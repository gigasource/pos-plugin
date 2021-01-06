const Hooks = require('schemahandler/hooks/hooks')
const express = require('express')
const path = require('path')
const setupTest = require('../../test-utils/setupTest')
const { toMatchImageSnapshot } = require('jest-image-snapshot')
const { createSSRApp } = require('vue')
expect.extend({ toMatchImageSnapshot });
const puppeteer = require('puppeteer');

const server = express()
const port = 3000
let AppFactory
let manifest
const testHook = new Hooks()

describe('PosLogin visual tests', function () {
  beforeAll(async function () {
    await setupTest({
      componentName: 'PosLogin',
      componentPath: path.resolve(__dirname, './PosLogin.vue')
    })
    manifest = require('../../../dist_test/ssr-manifest.json')
    AppFactory = require('../../test-utils/AppFactory').default

    let stylesheet = ''
    Object.keys(manifest).forEach(file => {
      if (file.endsWith('css')) {
        server.use(`/${manifest[file]}`, express.static(path.join(__dirname, '../../dist_test', manifest[file])))
        stylesheet += `\n<link rel="stylesheet" href=${manifest[file]} />`
      }
    })

    server.get('*', async (req, res) => {
      let AppWillBeRendered
      testHook.emit('App', AppWillBeRendered, e => eval(e))
      const app = createSSRApp(AppWillBeRendered)
      const appContent = await renderToString(app)

      const html = `
			  <html>
			    <head>
			      <title>Hello</title>
			      ${stylesheet}
			    </head>
			    <body>
			      ${appContent}
			    </body>
			  </html>
		  `;

      res.end(html);
    })

    server.listen(port, () => console.log(`Listening on: ${port}`))
  })

  it('should render pos-login page', async function () {
    const ssrView = require(path.join(__dirname, '../../dist_test', manifest['main.js'])).default

    const App = AppFactory(ssrView)

    testHook.on('App', function (AppWillBeRendered) {
      this.update('AppWillBeRendered', App)
    })
    let browser = await puppeteer.launch({
      headless: false
    })
    let page = await browser.newPage()
    await page.goto('http://localhost:3000')
    const image = await page.screenshot({ fullPage: true })
    expect(image).toMatchImageSnapshot()
    done()
  });
});
