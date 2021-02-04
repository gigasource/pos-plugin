<template>
  <g-toolbar color="#eee" elevation="0" height="100%">
    <g-btn :uppercase="false" background-color="white" class="mr-3" style="margin-left: -4px" @click.stop="back">
      <g-icon class="mr-2" svg>icon-back</g-icon>
      {{$t('ui.back')}}
    </g-btn>
<!--    <g-btn :uppercase="false" background-color="white" class="mr-3">-->
<!--      <g-icon class="mr-2" svg>icon-menu</g-icon>-->
<!--      More-->
<!--    </g-btn>-->
    <g-badge overlay color="#FF4452" v-if="savedOrders && savedOrders.length > 0">
      <template v-slot:badge>
        <span>{{savedOrders.length}}</span>
      </template>
      <g-btn :uppercase="false" background-color="white" @click="openDialogSavedList">
        <g-icon class="mr-2" svg>icon-folder</g-icon>
        {{$t('order.savedList')}}
      </g-btn>
    </g-badge>
    <g-btn :uppercase="false" v-else background-color="white" @click="openDialogSavedList">
      <g-icon class="mr-2" svg>icon-folder</g-icon>
      {{$t('order.savedList')}}
    </g-btn>
  </g-toolbar>
</template>

<script>
  export default {
    name: 'PosOrderScreenToolbar',
    injectService: ['OrderStore:(savedOrders,getSavedOrders)'],
    methods: {
      async openDialogSavedList() {
        await this.getSavedOrders()
        this.$getService('dialogSavedList:setActive')(true)
      },
      back() {
        this.$getService('OrderStore:resetOrderData')()
        this.$router.push({path: '/pos-dashboard'})
      }
    },
    async mounted() {
      await this.getSavedOrders()
    }
  }
</script>

<style scoped lang="scss">
  .toolbar {
  .g-badge-wrapper .g-btn {
    margin-right: 0;
  }

  ::v-deep .g-toolbar-content {
    overflow: visible;

    & > .g-btn:first-child {
      margin-left: 0;
    }
  }

  .g-toolbar-background > div {
    box-shadow: inset -8px 0 8px -8px rgba(0, 0, 0, 0.25);
  }
  }
</style>
