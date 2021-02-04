<template>
  <div class="info">
    <g-avatar size="40">
      <g-img :src="srcImg"></g-img>
    </g-avatar>
    <div style="margin-left: 8px; line-height: 1.2; font-weight: 600">
      <p class="username">{{userName}}</p>
      <p class="dateTime">{{dateTime}}</p>
    </div>
    <g-spacer/>
    <g-btn-bs class="elevation-2" @click="back">
      <g-icon>icon-back</g-icon>
    </g-btn-bs>
    <g-badge overlay color="#FF4452" v-if="savedOrders && savedOrders.length > 0">
      <template v-slot:badge>
        <span>{{savedOrders.length}}</span>
      </template>
      <g-btn-bs class="elevation-2" @click="openDialogSavedList">
        <g-icon>icon-folder</g-icon>
      </g-btn-bs>
    </g-badge>
    <g-btn-bs v-else  class="elevation-2" @click="openDialogSavedList">
      <g-icon>icon-folder</g-icon>
    </g-btn-bs>
  </div>
</template>

<script>
export default {
  name: "PosRetailMobileInfo",
  injectService: ['PosStore:(user, storeLocale)', 'OrderStore:(savedOrders,getSavedOrders)'],
  props: {},
  data() {
    return {
      time: null
    }
  },
  created() {
    this.time = new Date()
    this.interval = setInterval(() => {
      this.time = new Date()
    }, 60000)
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  computed: {
    userName() {
      return this.user ? this.user.name : ''
    },
    srcImg() {
      return this.user ? this.user.avatar : ''
    },
    dateTime() {
      return dayjs(this.time).format('MMM DD, YY • HH:mm')
    },
  },
  methods: {
    back() {
      this.$router.push({path: '/pos-dashboard'})
    },
    async openDialogSavedList() {
      await this.getSavedOrders()
      this.$getService('dialogSavedList:setActive')(true)
    },
  }
}
</script>

<style scoped lang="scss">
.info {
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 14px;
}
</style>
