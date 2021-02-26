const eventNames = {
  Init: 'call-system--init',
  SwitchMode: 'call-system--switch-mode',
  GetUsbDevices: 'call-system--get-usb-devices',
  GetUsbDevicesResponse: 'call-system--get-usb-devices-resp',
  ConnectionStatusChange: 'call-system--connection-status-change',

  UpdateCallSystemStatus: 'update-call-system-status',
  GetCallSystemStatus: 'get-call-system-status',
  RefreshCallSystemConfig: 'refresh-call-system-config',
  CancelMissedCallTimeout: 'cancel-missed-call-timeout',
  NewPhoneCall: 'new-phone-call',
  NewMissedPhoneCall: 'new-missed-phone-call',
}

module.exports = eventNames
