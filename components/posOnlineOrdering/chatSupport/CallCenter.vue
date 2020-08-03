<template>
  <div class="call-center">
    <template v-for="(value, key) in callees">
      <div class="call-center--content" v-if="getActiveCall(key, value.status)">
        <!-- Status -->
        <div class="row-flex align-items-center" v-if="value.status === 'waiting'">
          Calling
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="row-flex align-items-center" v-if="value.status === 'cancelling'">
          Cancelling
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="row-flex align-items-center" v-if="value.status === 'connecting'">
          Connecting
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div v-if="value.status === 'calling'" class="calling-animation">Call in progress</div>
        <div class="row-flex align-items-center" v-if="value.status === 'ending'">
          Ending
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="row-flex align-items-center" v-if="value.status === 'ended'">
          Ended.
        </div>
        <div v-if="value.status === 'rejected'">Call rejected</div>
        <g-spacer/>
        <!-- Time -->
        <div v-if="second" class="fw-400">{{time}}</div>
        <!-- Actions -->
        <div>
          <g-btn-bs background-color="#FF4452" rounded style="padding: 12px"
                    v-if="value.status === 'waiting'" @click="cancelCall(key)">
            <g-icon size="30" color="white">close</g-icon>
          </g-btn-bs>
  
          <g-btn-bs background-color="#FF4452" rounded style="padding: 12px"
                    v-if="value.status === 'calling'" @click="endCall(key)">
            <g-icon size="30" style="transform: rotate(-135deg)">fas fa-phone</g-icon>
          </g-btn-bs>
          
          <g-btn-bs background-color="#FF4452" rounded style="padding: 12px"
                    v-if="value.status === 'rejected' || value.status === 'ended'" @click="closeCall(key)">
            <g-icon size="30" color="white">close</g-icon>
          </g-btn-bs>
        </div>

        <!-- Screencast host -->
        <iframe v-if="value.status === 'connecting' || value.status === 'calling'"
                :src="getCallingSrc(key)"
                :key="key"
                style="position: fixed; top: 300px; left: 200px; width: 0; height: 0"
                allow="camera;microphone">
        </iframe>
      </div>
    </template>
  </div>
</template>
<script>
  export default {
    name: 'CallCenter',
    props: {
      deviceId: String
    },
    data: function () {
      return {
        callees: {},
        agentId: new Date().getTime().toString(),
        second: 0,
        timer: null,
      }
    },
    created() {
      cms.socket.on('makeAPhoneCallAck', this.makeAPhoneCallAck)
      cms.socket.on('cancelCallAck', this.cancelCallAck)
      cms.socket.on('endCallAck', this.endCallAck)
      cms.socket.on('endCallFromUser', this.endCallFromUser)
      window.addEventListener('message', this.handlemessage)
    },
    beforeDestroy() {
      window.removeEventListener('message', this.handlemessage)
    },
    computed: {
      time() {
        let format = 'HH:mm:ss'
        if (this.second < 3600) format = 'mm:ss'
        return dayjs().startOf('day').add(this.second, 'second').format(format)
      }
    },
    methods: {
      // actions
      makeAPhoneCall(clientId) {
        console.log('make a phone call')
        cms.socket.emit('makeAPhoneCall', {clientId, agentId: this.agentId})
        this.$set(this.callees, clientId, {status: 'waiting'})
      },
      // cancel while 'waiting' the response from customer
      cancelCall(clientId) {
        cms.socket.emit('cancelCall', {clientId, agentId: this.agentId})
        this.$set(this.callees, clientId, {status: 'cancelling'})
      },
      // end call while 'calling' to the customer
      endCall(clientId) {
        console.log('ending call')
        cms.socket.emit('endCall', {clientId, agentId: this.agentId})
        this.$set(this.callees, clientId, {status: 'ending'})
        clearInterval(this.timer)
      },
      // close current call dialog, bubble, etc
      closeCall(clientId) {
        console.log('close call')
        this.second = 0
        this.$set(this.callees, clientId, undefined)
        delete this.callees[clientId]
      },
      // acknowledge
      makeAPhoneCallAck({clientId, agentId, callAccepted}) {
        if (agentId === this.agentId) {
          if (callAccepted) {
            if (this.callees[clientId] && this.callees[clientId].status === 'waiting') {
              this.$set(this.callees, clientId, {status: 'connecting'})
              this.connectingClientId = clientId // work-around
            }
          } else {
            console.log('rejected!')
            this.$set(this.callees, clientId, {status: 'rejected'})
          }
        }
      },
      handlemessage(e) {
        console.log(e.data)
        if (e.data.startsWith('webrtc--onMediaStreamReady')) {
          console.log('webrtc--onMediaStreamReady')
          if (this.connectingClientId) {
            this.$set(this.callees, this.connectingClientId, {status: 'calling'})
            this.timer = setInterval(() => this.second++, 1000)
          }
        }
      },
      cancelCallAck({clientId, agentId}) {
        if (agentId === this.agentId) {
          console.log('cancelled')
          this.closeCall(clientId)
        }
      },
      endCallAck({clientId, agentId}) {
        console.log('end call ack')
        if (agentId === this.agentId) {
          console.log('ended')
          this.$set(this.callees, clientId, { status: 'ended' })
        }
      },
      endCallFromUser({clientId, agentId}) {
        if (agentId === this.agentId) {
          clearInterval(this.timer)
        }
        this.endCallAck({clientId, agentId})
      },
      // helper
      getCallingSrc(callee) {
        return `https://screencast.gigasource.io/remoteControl.html?deviceId=device_${callee}&useAudio=true`
      },
      getActiveCall(key, status) {
        if (key !== this.deviceId) return false
        // if (['cancelled', 'ended'].includes(status)) return false
        return true
      }
    }
  }
</script>
<style scoped lang="scss">
  .call-center {

    &--content {
      display: flex;
      align-items: center;
      padding: 16px;
      background: rgba(139, 139, 139, 0.9);
      color: white;
      font-size: 20px;
      font-weight: 700;
    }

    .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      margin-left: 4px;
      margin-top: 8px;
      background: #fff;
      animation: wave 1.3s linear infinite;

      &:nth-child(2) {
        animation-delay: -1.1s;
      }

      &:nth-child(3) {
        animation-delay: -0.9s;
      }
    }
  }

  @keyframes wave {
    0%, 60%, 100% {
      transform: initial;
      opacity: 1;
    }

    30% {
      transform: translateY(-5px);
      opacity: 0;
    }
  }
</style>
