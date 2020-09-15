<template>
  <div class="connection-status" :style="{color: online && webShopConnected ? '#2979FF' : '#FF4452'}">
    <g-icon size="20" class="mr-2">{{icon}}</g-icon>
    {{status}}
  </div>
</template>

<script>

  export default {
    name: 'ConnectionStatusBtn',
    injectService: ['PosStore:(webShopConnected,online)'],
    mounted() {
      this.online = navigator.onLine
    },
    computed: {
      icon() {
        if(this.online && this.webShopConnected) {
          return 'icon-wlan'
        } else if (this.online && !this.webShopConnected) {
          return 'icon-wlan-error'
        } else {
          return 'no-internet'
        }
      },
      status() {
        if(this.online && this.webShopConnected) {
          return 'Internet'
        } else if (this.online && !this.webShopConnected) {
          return 'Error'
        } else {
          return 'No Internet'
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .connection-status {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  @media screen and (max-width: 1023px) {
    .connection-status {
      font-size: 12px;
    }
  }
</style>
