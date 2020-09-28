const fs = require('fs');

const cloneBuffer = require('clone-buffer');

const _ = require('lodash');

const net = require("net");
const uuidV1 = require('uuid/v1');
const os = require('os');
const request = require('request');
const normalizeString = require('./normalize-string');

const {png, pngCompress} = require('./png');

const queue = require('queue');
let SerialPort;
const coms = {};
const chalk = require('chalk');

let Print;
const epsonConfig = require('node-thermal-printer/configs/epsonConfig');
const starConfig = require('node-thermal-printer/configs/starConfig');

const bluetoothQueue = {};
const cms = global['cms'];
let nr = 0;
const JsonFn = require('json-fn')

const BluetoothManager = {
  push: function (mac, {channel, printer, nr}) {
    if (!bluetoothQueue[mac]) bluetoothQueue[mac] = queue({autostart: true, concurrency: 1});
    bluetoothQueue[mac].push(function (next) {
      let reprintTime = 0;
      const _print = () => {
        console.log(`bt, print Nr: ${nr}`);
        printer.printBluetooth(mac, channel).then(function () {
          if (reprintTime > 10) {
            cms.io.emit('message', JsonFn.stringify({
              path: 'printErrorResolve',
              printer: 'bluetooth',
              name: printer.address.name,
              mac
            }));
          }
          next();
        }, (e) => {
          console.warn(e);
          if (reprintTime < 5000) {
            const cb = () => {
              reprintTime++;
              console.log(`reprintTime: ${reprintTime}`);
              setTimeout(function () {
                console.log(`wait finished!`);
                _print();
              }, (reprintTime < 3) ? 500 : 5000);
            }
            cb();
          } else {
            next();
            reprintTime++;
          }
        });
      }
      _print();
    })
  }
};

const lanQueue = {};
let lanBufferTimeout = {};
let lanBuffer = {};

function _push(ip, {nr, printer}) {
  if (!ip) return;
  if (!lanQueue[ip]) lanQueue[ip] = queue({autostart: true, concurrency: 1});
  lanQueue[ip].push(function (next) {
    let reprintTime = 0;
    const _print = () => {
      console.log(`lan, print Nr: ${nr}`);
      printer.printIp(ip, nr).then(function () {
        if (reprintTime > 10) {
          cms.io.emit('message', JsonFn.stringify({
            path: 'printErrorResolve',
            printer: 'ip',
            address: ip
          }));
        }
        next();
      }, (e) => {
        if (reprintTime === 10) {
          cms.io.emit('message', JsonFn.stringify({
            path: 'printError',
            printer: 'ip',
            address: ip,
            name: printer.address.name,
          }));
        }

        console.warn(e.message);
        if (reprintTime < 1000) {
          reprintTime++;
          console.log(`reprintTime: ${reprintTime}`);
          setTimeout(function () {
            console.log(`wait finished!`);
            _print();
          }, 5000);
        } else {
          next();
          reprintTime++;
        }
      });
    }
    _print();
  })
}

const LanManager = {
  push: function (ip, {nr, printer}) {
    if (lanBufferTimeout[ip]) clearTimeout(lanBufferTimeout[ip]);

    if (lanBuffer[ip]) {
      lanBuffer[ip] = Buffer.concat([lanBuffer[ip], printer.buffer]);
    } else {
      lanBuffer[ip] = printer.buffer;
    }

    //lanBufferTimeout[ip] = setTimeout(function () {
    lanBufferTimeout[ip] = null;
    printer.buffer = lanBuffer[ip];
    _push(ip, {nr, printer});
    lanBuffer[ip] = null;
    //}, 0);

  }
};

const usbQueue = queue({autostart: true, concurrency: 1})

const UsbManager = {
  iface: {},
  endpoint: {},
  inEndpoint: {},
  queues: {},
  device: {},
  push: function (path, {nr, printer}) {
    const uuid = uuidV1();
    usbQueue.push(next => {
      let reprintTime = 0;
      const _print = () => {
        console.log("\x1b[32m%s\x1b[0m", `print Nr: ${nr}, buffer length : ${printer.buffer.length}`);
        this.queues[uuid] = null;
        printer.printUsb(path, nr).then(next, (e) => {
          UsbManager.iface = {};
          console.warn(e.message);
          if (reprintTime < 1000) {
            reprintTime++;
            console.log(`reprintTime: ${reprintTime}`);
            setTimeout(function () {
              console.log(`wait finished!`);
              _print();
            }, reprintTime === 1 ? 1000 : 5000);
          } else {
            next();
            reprintTime++;
          }
        });
      }
      _print();

    })
  }
}

const integrateQueue = queue({autostart: true, concurrency: 1})

const IntegrateManager = {
  push: function ({printer, nr}) {
    console.log('Im fucking printing this !!!')
    integrateQueue.push(function (next) {
      let reprintTime = 0
      const _print = () => {
        console.log(`bt, print Nt: ${nr}`)
        printer.printIntegrate().then(function () {
          if (reprintTime > 10) {
            cms.io.emit('message', JsonFn.stringify({
              path: 'printErrorResolve',
              printer: 'Integrate_Usb',
              name: 'Integrated_Printer'
            }))
          }
          next();
        }, (e) => {
          console.warn(e)
          if (reprintTime < 500) {
            const cb = () => {
              reprintTime++
              console.log(`reprintTime: ${reprintTime}`)
              setTimeout(function () {
                console.log('Wait finished !')
                _print()
              }, (reprintTime < 3) ? 500 : 5000)
            }
            cb()
          } else {
            next()
            reprintTime++
          }
        })
      }
      _print()
    })
  }
}

let usb;
let beepReady = true;

function makeHeader(w, h) {
  return [0x1d, 0x76, 0x30, 48, (w >> 3) & 0xff, 0x00, h & 0xff, (h >> 8) & 0xff];
}

const lanPrinters = {};
const lanPrinterTimeout = {};

let warmupTimeout;

module.exports = class EscPrinter {
  constructor(address, initConfig) {
    if (!initConfig) {
      this.config = epsonConfig;
      initConfig = this.printerConfig = {type: 'epson'};
    } else {
      this.config = epsonConfig;
      this.printerConfig = initConfig;
    }

    if (!initConfig.width) initConfig.width = 48;
    if (!initConfig.characterSet) initConfig.characterSet = "SLOVENIA";
    if (typeof (initConfig.removeSpecialCharacters) == "undefined") initConfig.removeSpecialCharacters = false;
    if (typeof (initConfig.replaceSpecialCharacters) == "undefined") initConfig.replaceSpecialCharacters = true;

    this.compress = false;
    if (address.printerType === 'com') this.compress = true;
    this.address = address;

    this.buffer;

    this.alignLeft();
  }

  setCompress(c) {
    this.compress = c;
  }

  printIp(ip, nr) {
    return new Promise((resolve, reject) => {
      if (ip) {
        let lanPrinter;
        if (lanPrinterTimeout[ip]) {
          lanPrinter = lanPrinterTimeout[ip];
          delete lanPrinter._events.close;
          delete lanPrinter._events.error;
        } else {
          lanPrinter = new net.Socket();
          lanPrinterTimeout[ip] = lanPrinter;
        }

        let first = true;
        let _err = false;
        let rejected = false;
        let end = false;
        let normalEnd = false;
        lanPrinter.on('error', function (err) {
          _err = true;
          reject(err);
          rejected = true;
          try {
            if (!end) lanPrinter.end();
          } catch (e) {
            console.warn(e);
          }
        })

        let endHandler = (e) => {
          end = true;
          if (e || !normalEnd) {
            _err = true;
            if (!rejected) {
              reject(e || new Error('Printer is busy'));
              rejected = true;
            }
            return;
          }

          if (first) {
            first = false;
            if (!_err) {
              this.clear()
              resolve();
              console.log(`print nr ${nr}, ip: ${ip} end!!!`);
            }
          }
        };

        lanPrinter.on('close', endHandler);

        lanPrinter.connect({
          host: ip,
          port: 9100
        }, () => {
          if (_err) {
            if (!end) lanPrinter.end();
            return;
          }
          console.log(`print nr ${nr}, ip: ${ip} connected`);
          lanPrinters[ip] = lanPrinter;
          try {
            lanPrinter.write(this.buffer, null, (err) => {
              if (err) {
                if (!end) lanPrinter.end();
                if (!rejected) {
                  reject(err);
                  rejected = true;
                }
                return;
              }
              setTimeout(() => {
                if (!end) {
                  normalEnd = true;
                  lanPrinter.end();
                }
              }, 1000);
              setTimeout(() => {
                if (!normalEnd) return;
                if (first) {
                  console.log(`print nr ${nr}, ip: ${ip} timeout !!!`);
                  endHandler();
                }
              }, 60000);
            });
          } catch (e) {
            console.warn(e);
            if (!end) lanPrinter.end();
          }
        });

      }
    })
  }

  printCom(comName) {
    return new Promise((resolve, reject) => {
      let sp;
      let mustInit = true;
      if (!coms[comName]) {
        if (!SerialPort) SerialPort = require('serialport');
        sp = new SerialPort(comName, {baudRate: 9600});
        //sp = new SerialPort(comName, {baudRate: 115200});
        coms[comName] = sp;
      } else {
        mustInit = false;
        sp = coms[comName];
      }

      sp.on("error", function (e) {
        reject(e);
      })

      const _print = () => {
        sp.write(this.buffer, (err, results) => {
          if (err) {
            console.warn(err);
            reject();
          }
          sp.drain((err) => {
            if (err) {
              console.warn(err);
            }

            //sp.close();
            this.clear();
            resolve();
          });
        });
      }

      if (mustInit) {
        sp.on("open", function () {
          _print();
        });

        sp.on("disconnect", function () {
          coms[comName] = null;
        });
      } else {
        _print();
      }

    })
  }

  printBluetooth(mac, channel) {
    return new Promise((resolve, reject) => {
      if (/^linux/.test(process.platform)) {
        //this.append(new Buffer([0x1b, 0x40, 0x1d, 0x72, 1]));
        this.appendFeedback();

        request({
          encoding: null,
          method: "POST",
          uri: `http://127.0.0.1:5000/print`,
          json: {address: mac, channel: channel, data: this.buffer.toString('base64')}
        }, (error, response, body) => {
          if (error) {
            console.log('Bluetooth server is died !!!');
            console.warn(error);
            return reject(error);
          }
          if (!body) return reject(error);
          console.log("print finished !!!".red);
          this.clear();
          resolve();
        })
      } else {
        console.log('print to bluetooth');

        const btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

        console.log(`mac: ${mac}, channel: ${channel}`);

        btSerial.connect(mac, channel, () => {
          let closed = false;
          this.appendFeedback();
          btSerial.write(this.buffer, (err, bytesWritten) => {
            btSerial.on('data', function (buffer) {
              console.log(buffer.toString('hex').red);
              btSerial.close();
            });

            if (err) {
              console.warn(err);
              return reject(err);
            }
          });

          let firstClosedHappen = false;
          let resolved = false;

          btSerial.on('closed', () => {
            console.log('closed');
            resolved = true;
            this.clear();
            resolve();
          });

        }, reject);
      }

    })
  }

  appendFeedback() {
    if (!this.alreadyAppendFeedback) {
      this.append(new Buffer([0x1b, 0x40, 0x10, 0x04, 1]));
    }
    this.alreadyAppendFeedback = true;
  }

  printUsb(path) {
    if (!usb) {
      usb = require('usb');

      usb.on('detach', function (device) {
        UsbManager.iface = {};
      });
    }

    return new Promise((resolve, reject) => {
      if (this.buffer.length > 100) this.append(new Buffer([0x1b, 0x40, 0x1d, 0x72, 1]));

      let outEndpoint, inEndpoint;
      let iface;
      let device;

      function closeConnection() {
        if (iface) {
          device.close();
          UsbManager.iface[path] = null;
        }
      }

      try {

        if (UsbManager.iface[path]) {
          device = UsbManager.device[path];
          iface = UsbManager.iface[path];

          if (/^linux/.test(process.platform)) {
            console.log('Linux!!!');

            if (iface.isKernelDriverActive()) {

              try {
                iface.detachKernelDriver();
              } catch (e) {
                console.error("[ERROR] Could not detatch kernel driver: %s", e)
              }

            }

          }

          try {
            iface.claim();
            outEndpoint = _.find(iface.endpoints, {direction: 'out'});
            inEndpoint = _.find(iface.endpoints, {direction: 'in'});
          } catch (e) {
            iface = null;
            UsbManager.iface[path] = null;
          }
        }

        if (!iface) {
          const devices = usb.getDeviceList();


          try {
            device = _.find(devices, d => d.deviceDescriptor ? `${d.deviceDescriptor.idVendor.toString(16)}/${d.deviceDescriptor.idProduct.toString(16)}/${d.portNumbers.join('/')}` === path : false);
          } catch (e) {
          }

          if (!device) {
            try {
              device = _.find(devices, d => d.deviceDescriptor ? `${d.deviceDescriptor.idVendor.toString(16)}/${d.deviceDescriptor.idProduct.toString(16)}` === _.take(path.split('/'), 2).join('/') : false);
            } catch (e) {
            }
          }

          if (!device) {
            try {
              let devices = usb.getDeviceList().filter(function (device) {
                try {
                  return device.configDescriptor.interfaces.filter(function (iface) {
                    return iface.filter(function (conf) {
                      return conf.bInterfaceClass === 0x07;
                    }).length;
                  }).length;
                } catch (e) {
                  return false;
                }
              });
              if (devices.length > 0) device = devices[0];
            } catch (e) {
            }

          }

          if (!device) {
            return reject(new Error('No device'));
          }

          device.open();

          iface = device.interface(0);

          if (/^linux/.test(process.platform) || /^android/.test(process.platform)) {
            console.log('Linux!!!');

            if (iface.isKernelDriverActive()) {

              try {
                iface.detachKernelDriver();
              } catch (e) {
                console.error("[ERROR] Could not detatch kernel driver: %s", e)
              }

            }

          }

          iface.claim();
          outEndpoint = _.find(iface.endpoints, {direction: 'out'});
          inEndpoint = _.find(iface.endpoints, {direction: 'in'});

          UsbManager.iface[path] = iface;
          UsbManager.endpoint[path] = outEndpoint;
          UsbManager.inEndpoint[path] = inEndpoint;
          UsbManager.device[path] = device;
        }
        let finish = false;
        let transfered = false;

        function _resolve() {
          inEndpoint.stopPoll(function () {
            iface.release(() => {
              //todo: close
              console.log('usb print finished !');
              closeConnection();
              resolve();
            })
          })
        }

        inEndpoint.on('data', function (data) {
          if (!finish && data.length !== 0) {
            finish = true;
            if (transfered) _resolve();
          }
        })

        inEndpoint.on('error', function (e) {
          console.warn(e);
          closeConnection();
          return reject(err);
        })

        inEndpoint.startPoll(2, 8);

        outEndpoint.transfer(this.buffer, err => {
          transfered = true;
          console.log('transfer finished!');
          if (err) {
            console.log('USB CRASH'.red);
            console.warn(err);
            closeConnection();
            return reject(err);
          }

          if (finish) {
            _resolve();
          } else {
            setTimeout(function () {
              console.log('print Timeout !!!')
              if (!finish) {
                _resolve();
                finish = true;
              }
            }, 1500);
          }

        });

        outEndpoint.on('error', function (e) {
          console.warn(e);
          closeConnection();
          return reject(err);
        })
      } catch (e) {
        console.log('catch error');
        console.warn(e);
        closeConnection();
        return reject(e);
      }
    })
  }

  printIntegrate() {
    return new Promise ((resolve, reject) => {
      request({
        encoding: null,
        method: "POST",
        uri: `http://127.0.0.1:5000/print`,
        json: {data: this.buffer.toString('base64')}
      }, (err, res, body) => {
        if (err) {
          console.log('Integrate server is dead !!!');
          console.warn(err);
          return reject(err);
        }
        if (!body) return reject(err)
        console.log("Print Finished !!!".red);
        this.clear();
        resolve();
      })
    })
  }

  printWithDriver(printerName) {

    console.log(printerName);
    console.time('printRaw');

    if (!Print) Print = require('printer');
    Print.printDirect({
      data: this.buffer,
      printer: printerName,
      type: 'RAW',
      success: (jobID) => {
        console.timeEnd('printRaw');
        console.log("sent to this with ID: " + jobID);
        this.clear();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  async print(cut = true) {
    //this.append(this.config.HW_INIT);
    console.log('printing...');
    if (cut) this.cut();
    if (beepReady && this.address.beep) {
      this.beep();
      beepReady = false;
      setTimeout(() => beepReady = true, 5000)
    }
    if (this.address.printerType === 'ip') {
      if (warmupTimeout) {
        this.addBlankDataToQuitRasterMode(1500);
        clearTimeout(warmupTimeout);
      } else {
        this.addBlankDataToQuitRasterMode(8000);
      }

      warmupTimeout = setTimeout(() => {
        warmupTimeout = null;
      }, 20 * 1000);

      LanManager.push(this.address.ip, {
        nr,
        printer: this
      });
      nr++;
    } else if (this.address.printerType === 'com') {
      this.buffer = Buffer.concat([new Buffer([0x1B, 0x52, 2]), this.buffer]);
      await this.printCom(this.address.com);
    } else if (this.address.printerType === 'bluetooth') {
      this.addBlankDataToQuitRasterMode(1500);
      BluetoothManager.push(this.address.bluetooth, {
        nr,
        channel: this.address.bluetoothChannel,
        printer: this
      });
      nr++;
    } else if (this.address.printerType === 'usb') {
      //yield this.printUsb(this.address.usb, cut);
      UsbManager.push(this.address.usb, {
        nr,
        printer: this
      });
      nr++;
    } else if (this.address.printerType === 'integrate') { // must be integrate
      IntegrateManager.push({
        printer: this,
        nr
      })
    } else if (this.address.printer) {
      this.printWithDriver(this.address.printer);
    }
  }

  addBlankDataToQuitRasterMode(nr) {
    this.buffer = Buffer.concat([new Buffer(_.fill(Array(nr), 0)), new Buffer([0x0c, 0x1b, 0x5c, 0, 0]), this.buffer]);
  }

  cut() {
    this.partialCut();
  }

  linefeed(length) {
    for (let i = 0; i < (length ? length : 6); i++) {
      this.append(this.config.CTL_LF);
    }
  }

  partialCut() {
    this.linefeed();
    this.append(this.config.PAPER_PART_CUT);
  }

  beep() {
    this.append(new Buffer([0x1B, 0x42, 0x5, 0x01]));
  }

  getWidth() {
    return parseInt(this.printerConfig.width);
  }

  getText() {
    return buffer.toString();
  }

  clear() {
    this.buffer = null;
  }

  add(buffer) {
    this.append(buffer);
  }

  text(text) {
    this.append(text.toString());
  }

  textLn(text) {
    this.append(text.toString());
    this.append("\n");
  }

  printVerticalTab() {
    this.append(this.config.CTL_VT);
  }

  bold(enabled) {
    if (enabled) this.append(this.config.TXT_BOLD_ON);
    else this.append(this.config.TXT_BOLD_OFF);
  }

  underline(enabled) {
    if (enabled) this.append(this.config.TXT_UNDERL_ON);
    else this.append(this.config.TXT_UNDERL_OFF);
  }

  underlineThick(enabled) {
    if (enabled) this.append(this.config.TXT_UNDERL2_ON);
    else this.append(this.config.TXT_UNDERL_OFF);
  }

  upsideDown(enabled) {
    if (enabled) this.append(this.config.UPSIDE_DOWN_ON);
    else this.append(this.config.UPSIDE_DOWN_OFF);
  }

  invert(enabled) {
    if (enabled) this.append(this.config.TXT_INVERT_ON);
    else this.append(this.config.TXT_INVERT_OFF);
  }

  openCashDrawer() {
    this.append(new Buffer([0x1B, 0x70, 0x00, 50, 50]));
    this.append(new Buffer([0x1B, 0x70, 0x01, 50, 50]));
  }

  alignCenter() {
    this.append(this.config.TXT_ALIGN_CT);
  }

  alignLeft() {
    this.append(this.config.TXT_ALIGN_LT);
  }

  alignRight() {
    this.append(this.config.TXT_ALIGN_RT);
  }

  newLine() {
    this.append(this.config.CTL_LF);
  }

  drawLine() {
    for (let i = 0; i < this.printerConfig.width; i++) {
      this.append('-');
    }
    this.newLine();
  }

  leftRight(left, right) {
    this.append(left.toString());
    var width = this.printerConfig.width - left.toString().length - right.toString().length;
    for (let i = 0; i < width; i++) {
      this.append(new Buffer(" "));
    }
    this.append(right.toString());
    this.newLine();
  }

  printPng(img) {
    if (this.address.compress && this.address.printerType === 'bluetooth') {
      if (this.address.printerType === 'usb') {
        pngCompress(img, this.append.bind(this), 2000);
      } else {
        pngCompress(img, this.append.bind(this));
      }
    } else {
      png(img, this.append.bind(this));
    }
  }

  append(buff) {
    if (typeof buff == "string") {
      buff = normalizeString(buff);

      // Remove special characters
      if (this.config.removeSpecialCharacters) {
        var unorm = require('unorm');
        var combining = /[\u0300-\u036F]/g;
        buff = unorm.nfkd(buff).replace(combining, '');
      }

      var endBuff = null;
      for (var i = 0; i < buff.length; i++) {
        var value = buff[i];
        var tempBuff = new Buffer(value);

        // Replace special characters
        if (this.config.replaceSpecialCharacters) {
          for (var key in this.config.specialCharacters) {
            if (value == key) {
              tempBuff = new Buffer([this.config.specialCharacters[key]]);
              break;
            }
          }
        }

        if (endBuff) endBuff = Buffer.concat([endBuff, tempBuff]);
        else endBuff = tempBuff;
      }

      buff = endBuff;
    }

    // Append character set
    if (!this.buffer && this.config.characterSet) this.buffer = this.setInternationalCharacterSet(this.config.characterSet);

    // Append new buffer
    if (this.buffer) {
      this.buffer = Buffer.concat([this.buffer, buff]);
    } else {
      this.buffer = buff;
    }
  }

  setInternationalCharacterSet(charSet) {
    if (charSet == "GERMANY") return this.config.CHARCODE_GERMANY;
    return null;
  }

  table(data) {
    const cellWidth = this.printerConfig.width / data.length;
    for (let i = 0; i < data.length; i++) {
      this.append(data[i].toString());
      const spaces = cellWidth - data[i].toString().length;
      for (let j = 0; j < spaces; j++) {
        this.append(new Buffer(" "));
      }
    }
    this.newLine();
  }


  // Options: text, align, width, bold
  tableCustom(data, options = {}) {
    let j;
    let spaces;
    let cellWidth = this.printerConfig.width / data.length;
    const secondLine = [];
    let secondLineEnabled = false;

    for (let i = 0; i < data.length; i++) {
      let tooLong = false;
      const obj = data[i];
      obj.text = obj.text.toString();

      if (obj.width) cellWidth = this.printerConfig.width * obj.width;
      if (options.textDoubleWith) cellWidth /= 2;
      if (obj.bold) this.bold(true);

      // If text is too wide go to next line
      if (cellWidth < obj.text.length) {
        tooLong = true;
        obj.originalText = obj.text;
        obj.text = obj.text.substring(0, cellWidth);
      }

      if (obj.align === "CENTER") {
        spaces = (cellWidth - obj.text.toString().length) / 2;
        for (j = 0; j < spaces; j++) {
          this.append(new Buffer(" "));
        }
        if (obj.text !== '') this.append(obj.text);
        for (j = 0; j < spaces - 1; j++) {
          this.append(new Buffer(" "));
        }

      } else if (obj.align === "RIGHT") {
        spaces = cellWidth - obj.text.toString().length;
        for (j = 0; j < spaces; j++) {
          this.append(new Buffer(" "));
        }
        if (obj.text !== '') this.append(obj.text);

      } else {
        if (obj.text !== '') this.append(obj.text);
        spaces = cellWidth - obj.text.toString().length;
        if (i === data.length - 1) spaces = Math.floor(spaces);
        for (j = 0; j < spaces; j++) {
          this.append(new Buffer(" "));
        }
      }

      if (obj.bold) this.bold(false);

      if (tooLong) {
        secondLineEnabled = true;
        if (options.textDoubleWith) obj.text = obj.originalText.substring(cellWidth);
        else obj.text = obj.originalText.substring(cellWidth - 1);
        secondLine.push(obj);
      } else {
        obj.text = "";
        secondLine.push(obj);
      }
    }

    if (!options.textDoubleWith) this.newLine();

    // Print the second line
    if (secondLineEnabled) {
      this.tableCustom(secondLine, options);
    }
  }

  printBarcode(data) {
    this.append(new Buffer([0x1d, 0x6B, 0x49]));
    this.append(new Buffer([data.length + 1]));
    this.append(new Buffer(data));
    this.append(new Buffer([0x10]));
  }

  setTextNormal() {
    this.append(this.config.TXT_NORMAL);
  }

  setTextDoubleHeight() {
    this.append(this.config.TXT_2HEIGHT);
  }

  setTextDoubleWidth() {
    this.append(this.config.TXT_2WIDTH);
  }

  setTextQuadArea() {
    this.append(this.config.TXT_4SQUARE);
  }

  println(text) {
    this.append(text.toString());
    this.append("\n");
  }

  printText(text) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line) this.println(line);
    }
  }
};
