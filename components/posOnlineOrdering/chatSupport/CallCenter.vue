<template>
  <div>
    <div v-for="(value, key) in callees">
      <!-- Status -->
      <div v-if="value.status === 'waiting'">Connecting...</div>
      <div v-if="value.status === 'calling'" class="calling-animation"></div>
      <div v-if="value.status === 'rejected'">Call rejected</div>
      
      <!-- Actions -->
      <div>
        <button v-if="value.status === 'waiting' || value.status === 'rejected'" @click="closeCall(key)">Cancel call</button>
        <button v-if="value.status === 'calling'" @click="endCall(key)">End call</button>
      </div>
      
      <!-- Screencast host -->
      <iframe v-if="value.status === 'calling'"
              :src="getCallingSrc(key)"
              :key="key"
              style="position: fixed; top: 300px; left: 200px; width: 0; height: 0"
              allow="camera;microphone">
      </iframe>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'CallCenter',
    props: {},
    data: function () {
      return {
        // {
        //    'CustomerId1': { status: 'waiting' },
        //    'CustomerId2': { status: 'calling', callTime: '00:02:20' }
        // }
        callees: {},
        agentId: new Date().getTime().toString(),
      }
    },
    created() {
      cms.socket.on('makeAPhoneCallAck', this.makeAPhoneCallAck)
    },
    methods: {
      // actions
      makeAPhoneCall(clientId) {
        console.log('make a phone call')
        cms.socket.emit('makeAPhoneCall', { clientId, agentId: this.agentId })
        this.$set(this.callees, clientId, { status: 'waiting' })
      },
      closeCall(clientId) {
        cms.socket.emit('cancelCall', { clientId })
        this.$set(this.callees, clientId, { status: 'cancelled' })
      },
      endCall(clientId) {
        cms.socket.emit('endCall', { clientId })
        this.$set(this.callees, clientId, { status: 'ended' })
      },
      // acknowledge
      makeAPhoneCallAck({clientId, agentId, callAccepted}) {
        console.log(clientId, agentId, callAccepted)
        if (callAccepted) {
          if (agentId === this.agentId) {
            console.log('callee', this.callees[clientId])
            console.log('update status to calling')
            if (this.callees[clientId] && this.callees[clientId].status === 'waiting') {
              this.$set(this.callees, clientId, { status: 'calling' })
            }
          } else {
            console.log('agent mismatch!, current agent: ' + this.agentId +  ' received agent: ' + agentId)
          }
        } else {
          console.log('The customer reject a phone call!')
          this.$set(this.callees, clientId, { status: 'rejected' })
        }
      },
      // helper
      getCallingSrc(callee) {
        return `https://screencast.gigasource.io/remoteControl.html?deviceId=device_${callee}&useAudio=true`
      },
    }
  }
</script>
<style scoped>
</style>
