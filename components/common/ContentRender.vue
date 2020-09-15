<template>
  <div class="content-render">
    <slot :name="viewName" v-bind="viewParams"/>
  </div>
</template>

<script>
  export default {
    name: 'ContentRender',
    props: {
      view: {
        type: Object,
        default: () => ({ name: '', params: '' })
      },
    },
    injectService: ['PosStore:(webShopConnected,online)', 'Snackbar:(showSnackbar)'],
    created() {
      let message = ''
      if(!this.online)
        message = this.$t('settings.noInternet')
      else if (!this.webShopConnected)
        message = this.$t('settings.noOnlineOrder')
      if(message) {
        const contentFn = () => (
            <div style="margin: 0 auto" class="row-flex align-items-center">
              <g-icon svg size="20">icon-wlan-disconnected-white</g-icon>
              <span class="ml-2">{message}</span>
            </div>);

        this.showSnackbar(contentFn, '#E57373', 0)
      }
    },
    computed: {
      viewName() {
        if (this.view)
          return this.view.name
      },
      viewParams() {
        if (this.view)
          return this.view.params
      }
    }
  }
</script>

<style scoped lang="scss">
  .content-render {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>

<style lang="scss">
  @media screen and (max-width: 1023px) {
    .content-render {
      font-size: 14px;
    }
  }
</style>
