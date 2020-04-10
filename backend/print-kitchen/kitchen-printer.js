const Vue = require('vue');
const _ = require('lodash')
const { renderer, print } = require('../print-utils/print-utils')

module.exports = async function (cms) {
  cms.socket.on('connect', socket => {
    socket.on('printKitchen', orderHandler)
  })

  async function orderHandler({ order, device }, callback) {
    try {
      const receipts = _.reduce(order.items, function (obj, item) {
        function addItem(i) {
          if (!item.groupPrinter) return;

          const groupPrinter = i === 1 ? item.groupPrinter : item.groupPrinter2;
          if (!groupPrinter) return;

          const receiptKey = JSON.stringify({
            groupPrinter: groupPrinter,
            course: item.course,
            takeout: item.takeout
          })

          if (!obj[receiptKey]) obj[receiptKey] = [];

          if (!_.find(item.modifiers, m => m.groupPrinter && m.groupPrinter !== groupPrinter)) {
            obj[receiptKey].push(item);
          } else {
            // case modifiers have another groupPrinter
            const modifierGroup = _.groupBy(item.modifiers, i => i.groupPrinter ? i.groupPrinter : groupPrinter);
            for (let _groupPrinter in modifierGroup) {
              const _item = {
                ...item,
                groupPrinter: _groupPrinter,
                modifiers: modifierGroup[_groupPrinter]
              }

              const _receiptKey = JSON.stringify({
                groupPrinter: _groupPrinter,
                course: item.course,
                takeout: item.takeout
              })

              if (!obj[_receiptKey]) obj[_receiptKey] = [];

              obj[_receiptKey].push(_item);
            }
          }
        }

        [1, 2].forEach(addItem);
        return obj;
      }, {})

      const results = await printHandler(receipts, order, device)
      callback({ success: true, results })
    } catch (e) {
      callbackWithError(callback, e)
    }
  }

  async function printHandler(receipts, order, device) {
    // get device printers
    const groupPrinters = await cms.getModel('GroupPrinter').aggregate([
      { $unwind: { path: '$printers' } },
      { $match: { 'printers.hardwares': device, 'type': 'kitchen' } },
    ])

    let results = []
    //render report
    await Promise.all(_.map(receipts, (value, key) => {
      return new Promise((resolve, reject) => {
        const { groupPrinter, course, takeout } = JSON.parse(key)

        const printer = groupPrinters.find(i => i.name === groupPrinter)
        if (!printer) return

        const KitchenReport = require('../../dist/Kitchen.vue')
        const props = {
          items: value,
          table: order.table,
          printer: printer.name,
          user: _.last(order.user).name,
          time: dayjs(order.date).format('HH:mm'),
          fontSize: printer.printers.fontSize,
          marginTop: printer.printers.marginTop,
          isKitchenReceipt: true,
          course,
          takeout
        }

        const component = new Vue({
          components: { KitchenReport },
          render(h) {
            return h('KitchenReport', { props })
          }
        })

        renderer.renderToString(component, {}, async (err, html) => {
          if (err) reject(err)
          await print(html, printer.printers)

          //todo remove from production
          results.push({
            items: value,
            printer: printer.printers,
            name: printer.name,
          })
          resolve()
        })
      })

    }))

    return results
  }

  function callbackWithError(callback, error) {
    callback({
      success: false,
      message: error.toString()
    })
  }
}