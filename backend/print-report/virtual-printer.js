const initCanvaskit = require('@gigasource/canvaskit-printer-renderer');
const {PNG} = require('pngjs')

const PRINT_VIRTUAL_REPORT = 'run:printVirtualReport'
const VIRTUAL_REPORT_ROOM = 'r_virtualReport'

module.exports = (cms) => {
  cms.socket.on('connect', socket => {
    socket.join(VIRTUAL_REPORT_ROOM)
  })

  cms.post(PRINT_VIRTUAL_REPORT, async ({ report, printData, printerInfo, type }) => {
    const CanvasPrinter = await initCanvaskit();
    const canvasPrinter = new CanvasPrinter(560, 50000, {
      printFunctions: {
        printPng: async (png) => {
          try {
            const bufferInBase64 = PNG.sync.write(png).toString('base64')
            const vReport = await cms.getModel('VirtualReport').create({
              imageContent: bufferInBase64,
              created: dayjs(),
              type: type,
              printerId: printerInfo._id,
              printerGroupId: printerInfo.groupPrinterId
            })
            cms.socket.to(VIRTUAL_REPORT_ROOM).emit('newVirtualReportCreated', { newReport: vReport })
          } catch (e) {
            console.log('canvasprinter: printPng exception', e)
          }
        },
        print: () => {},
      }
    });
    await report.printCanvas(canvasPrinter, printData, printerInfo.groupPrinter, 'canvas');
    canvasPrinter.cleanup();
  })
}

module.exports.cmsHookEvents = {
  PRINT_VIRTUAL_REPORT
}
