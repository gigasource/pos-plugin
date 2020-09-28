const CallStatus = {
  Idle: 'idle',
  Busy: 'busy'
}

const _calls = {}

module.exports = {
  makeCall: (sender, receiver) => {
    _calls[sender] = CallStatus.Busy
    _calls[receiver] = CallStatus.Busy
  },
  makeCallAck: (sender, receiver, callAccepted) => {
    const status = callAccepted ? CallStatus.Busy: CallStatus.Idle
    _calls[sender] = status
    _calls[receiver] = status
  },
  cancelCall: (sender, receiver) => {
    _calls[sender] = CallStatus.Idle
    _calls[receiver] = CallStatus.Idle
  },
  endCall: (sender, receiver) => {
    _calls[sender] = CallStatus.Idle
    _calls[receiver] = CallStatus.Idle
  },
  getStatus(id) {
    return _calls[id] || 'idle'
  },
  CallStatus
}
