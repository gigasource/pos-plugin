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
        <div v-if="value.status === 'calling'" class="calling-animation">Call in progress</div>
        <div v-if="value.status === 'rejected'">Call rejected</div>
        <g-spacer/>
        <!-- Time -->
        <div v-if="second" class="fw-400">{{time}}</div>
        <!-- Actions -->
        <div>
          <g-btn-bs background-color="#FF4452" rounded style="padding: 12px"
                    v-if="value.status === 'waiting' || value.status === 'rejected'" @click="closeCall(key)">
            <g-icon size="30" color="white">close</g-icon>
          </g-btn-bs>
          <g-btn-bs background-color="#FF4452" rounded style="padding: 12px"
                    v-if="value.status === 'calling'" @click="endCall(key)">
            <g-icon size="30" style="transform: rotate(-135deg)">fas fa-phone</g-icon>
          </g-btn-bs>
        </div>

        <!-- Screencast host -->
        <iframe v-if="value.status === 'calling'"
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
      closeCall(clientId) {
        cms.socket.emit('cancelCall', {clientId})
        this.$set(this.callees, clientId, {status: 'cancelled'})
      },
      endCall(clientId) {
        cms.socket.emit('endCall', {clientId})
        this.$set(this.callees, clientId, {status: 'ended'})
        clearInterval(this.timer)
        this.second = 0
      },
      // acknowledge
      makeAPhoneCallAck({clientId, agentId, callAccepted}) {
        console.log(clientId, agentId, callAccepted)
        if (callAccepted) {
          if (agentId === this.agentId) {
            console.log('callee', this.callees[clientId])
            console.log('update status to calling')
            if (this.callees[clientId] && this.callees[clientId].status === 'waiting') {
              this.$set(this.callees, clientId, {status: 'calling'})
              this.timer = setInterval(() => {
                this.second++
              }, 1000)
            }
          } else {
            console.log('agent mismatch!, current agent: ' + this.agentId + ' received agent: ' + agentId)
          }
        } else {
          console.log('The customer reject a phone call!')
          this.$set(this.callees, clientId, {status: 'rejected'})
        }
      },
      // helper
      getCallingSrc(callee) {
        return `https://screencast.gigasource.io/remoteControl.html?deviceId=device_${callee}&useAudio=true`
      },
      getActiveCall(key, status) {
        if (key !== this.deviceId) return false
        if (['cancelled', 'ended'].includes(status)) return false
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
