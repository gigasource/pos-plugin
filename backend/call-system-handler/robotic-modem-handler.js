module.exports = async (cms) => {
  const SerialPort = require('serialport');
  let roboticDevice;
  let connectionStatus = '';

  cms.socket.on('connect', internalSocket => {
    internalSocket.on('get-serial-devices', listSerialDevices);
    internalSocket.on('refresh-call-system-config', setupRoboticDevice);
    internalSocket.on('get-call-system-status', updateConnectionStatus);
  });

  async function updateConnectionStatus(cb, posSettings) {
    if (!posSettings) posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode} = callConfig;
    const useRoboticModem = mode === 'robotic-modem';

    if (cb && useRoboticModem) cb(connectionStatus);
    else cms.socket.emit('update-call-system-status', useRoboticModem ? connectionStatus : null);
  }

  async function listSerialDevices(cb) {
    let serialDeviceList = await SerialPort.list();
    serialDeviceList = serialDeviceList.map(device => {
      let deviceName = device.path;

      if (device.manufacturer) deviceName += ` - ${device.manufacturer}`;
      else device.manufacturer = '';

      device.fullName = deviceName;

      return device;
    }).sort((e1, e2) => {
      return e2.manufacturer.localeCompare(e1.manufacturer)
    });

    cb(serialDeviceList);
  }

  function reset() {
    if (roboticDevice) {
      roboticDevice.close(err => err && console.error(err));
      roboticDevice.removeAllListeners();
      roboticDevice = null;
    }
  }

  await setupRoboticDevice();

  async function setupRoboticDevice() {
    const posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode, ipAddresses = {}} = callConfig;
    const useRoboticDevice = mode === 'robotic-modem';

    if (!useRoboticDevice && roboticDevice) {
      reset();
    } else if (useRoboticDevice) {
      reset();
      roboticDevice = new SerialPort(ipAddresses[mode]);
      connectionStatus = 'Connecting...';
      await updateConnectionStatus(null, posSettings);

      const connectionErrorTimeout = setTimeout(() => {
        connectionStatus = 'Connection error, please choose another device';
        updateConnectionStatus();
      }, 5000);

      roboticDevice.on('open', function () {
        roboticDevice.write('AT+VCID=1\r', (err) => {
          if (err) console.error(err);
        });

        roboticDevice.on('data', function (data) {
          if (data.toString().trim() === 'OK') {
            clearTimeout(connectionErrorTimeout);
            connectionStatus = 'Connected';
            updateConnectionStatus();
          }

          handleRoboticData(data);
        });
      });

      roboticDevice.on('close', function () {
        connectionStatus = 'Disconnected';
        updateConnectionStatus();
      });
    }
  }

  function handleRoboticData(data) {
    const trimmedData = data.toString().trim();

    // if (trimmedData === 'NO CARRIER') {
    // this means the call is answered
    // (this signal appears a few seconds after the call ends)

    // } else {
    let callerPhoneNumber;
    const phoneData = trimmedData.split('\r\n');
    const callerNameInfo = phoneData.find(e => e.startsWith('NAME'));
    const callerNumberInfo = phoneData.find(e => e.startsWith('NMBR'));

    if (callerNameInfo) {
      callerPhoneNumber = callerNameInfo.split('=')[1];
    }

    if (callerNumberInfo && !(/^\d+$/.test(callerPhoneNumber))) {
      callerPhoneNumber = callerNumberInfo.split('=')[1];
    }

    if (/^\d+$/.test(callerPhoneNumber)) cms.socket.emit('new-phone-call', callerPhoneNumber, new Date());

    // }
  }
}

/*SerialPort.list().then(function (ports) {
  ports.forEach(function (port) {
    if ((/usbmodem00000021/i).test(port.comName)) {
      const sp = new SerialPort('/dev/tty.usbmodem00000021');
      sp.on("open", function () {
        console.log("Listening on port: ");
        //Send command to modem to show caller-id in nice format.
        sp.write("AT+VCID=1\r", function (err, results) {
          sp.drain(console.log('Enabling CallerId nice format: ' + results));
        });
        //Respond to data received from modem
        sp.on('data', function (data) {
          console.log('Data received: ' + data);
          //If data contains a number extract it and activate the current caller.
          if (data.indexOf("NMBR = ") > -1) {
            let phoneNumber = data.substring(7);
            phoneNumber = phoneNumber.substring(0, phoneNumber.length - 1);
            console.log('Callers number: ' + phoneNumber);
            // q.spawn(function* () {
            //   const customer = yield Customer.findOne({phone: phoneNumber});
            //   cms.io.emit('message', JsonFn.stringify({
            //     path: 'phone',
            //     phone: phoneNumber,
            //     customer
            //   }));
            // })
          }
        });
      });
    }
  });
});*/
