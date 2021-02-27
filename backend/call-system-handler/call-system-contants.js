const eventNames = {
  Init: 'call-system--init',
  SwitchMode: 'call-system--switch-mode',
  SwitchModeResponse: 'call-system--switch-mode-resp',
  GetUsbDevices: 'call-system--get-usb-devices',
  GetUsbDevicesResponse: 'call-system--get-usb-devices-resp',
  ConnectionStatusChange: 'call-system--connection-status-change',
  NewPhoneCall: 'new-phone-call',
  NewMissedPhoneCall: 'new-missed-phone-call',
  CancelMissedCallTimeout: 'cancel-missed-call-timeout',

  // out-of-date
  UpdateCallSystemStatus: 'update-call-system-status',
  GetCallSystemStatus: 'get-call-system-status',
  RefreshCallSystemConfig: 'refresh-call-system-config',
}

module.exports = eventNames
