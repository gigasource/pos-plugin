<template>
  <div class="function">
    <div class="function--up" v-show="computedBtnGroup1.length" >
      <div v-for="(btn, i) in computedBtnGroup1" :key="`up_${i}`"
           class="function-btn"
           @click="btn.click">
        <g-icon size="60">{{btn.icon}}</g-icon>
        <span class="mt-3 ta-center">{{btn.title}}</span>
      </div>
    </div>
    <g-divider color="#9e9e9e"/>
    <div class="function--down">
      <div v-for="(btn, i) in computedBtnGroup2" :key="`down_${i}`"
           class="function-btn"
           @click="btn.click">
        <g-icon size="60">{{btn.icon}}</g-icon>
        <span class="mt-3 ta-center">{{btn.title}}</span>
      </div>
    </div>
    
    <template>
      <g-dnd-dialog v-model="showIframe" :width="iframeWidth" :height="iframeHeight" lazy
                    :show-minimize="false"
                    :show-maximize="false"
                    @close="showIframe = false"
                    @dragStart="iframeDragging = true" @dragEnd="iframeDragging = false"
                    @resizeStart="iframeDragging = true" @resizeEnd="iframeDragging = false">
        <template #title>
          Online Order Setting
        </template>
        <div v-if="showIframe && iframeDragging"
             style="height: 100%; width: 100%; position: absolute; background: transparent"/>
        <iframe v-if="showIframe" :src="iframeSrc" width="100%" height="100%" ref="iframe"/>
      </g-dnd-dialog>
    </template>
  </div>
</template>

<script>
  export default {
    name: "PosDashboardFunction",
    props: {
      enabledFeatures: Array,
      user: null
    },
    data() {
      const i18n = this.$i18n;
      const { dashboard: { delivery, editMenuCard, editTablePlan, endOfDay, fastCheckout, monthlyReport, orderHistory, printerSettings, settings, staffReport, support, onlineOrdering } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        btnUp: [
          {title: fastCheckout, feature: 'fastCheckout',icon: 'icon-fast-checkout', click: () => this.changePath('/pos-order-2')},
          {title: delivery, feature: 'delivery', icon: 'icon-delivery', click: () => this.changePath('/pos-delivery')}
        ],
        btnDown: [
          {title: staffReport, feature: 'staffReport', icon: 'icon-staff-report', click: () => this.changePath('/pos-staff-report')},
          {title: settings, feature: 'settings', icon: 'icon-dashboard', click: () => this.changePath('/pos-settings')},
          {title: endOfDay, feature:'eodReport', icon: 'icon-calendar', click: () => this.changePath('/pos-eod-report')},
          {title: orderHistory, icon: 'icon-history', click: () => this.changePath('/pos-order-history')},
          {title: monthlyReport, feature: 'monthlyReport', icon: 'icon-month_report',  click: () => this.changePath('/pos-month-report')},
          {title: support, icon: 'icon-support-2',  click: () => this.changePath('/pos-support')},
          {title: editTablePlan, feature: 'editTablePlan', icon: 'icon-edit-table-plan',  click: () => this.changePath('/pos-edit-table-plan')},
          {title: editMenuCard, feature: 'editMenuCard', icon: 'icon-edit-menu-card',  click: () => this.changePath('/pos-edit-menu-card')},
          {title: printerSettings, feature: 'printerSettings', icon: 'icon-printer-setting',  click: () => this.changePath('/pos-printer-setting')},
          {title: onlineOrdering, feature: 'onlineOrdering', icon: 'icon-online-order-menu', click: this.openStoreSetting },
        ],
        showIframe: false,
        iframeWidth: window.innerWidth,
        iframeHeight: window.innerHeight,
        iframeSrc: 'about:blank',
        iframeDragging: false,
        iframeRefreshInterval: null,
      }
    },
    computed: {
      computedBtnGroup1() {
        if (!this.enabledFeatures || !this.enabledFeatures.length) return

        return this.btnUp.filter(item => {
          if (!item.feature) return true
          return (this.enabledFeatures.includes(item.feature))
        })
      },
      computedBtnGroup2() {
        if (!this.enabledFeatures || !this.enabledFeatures.length) return

        return this.btnDown.filter(item => {
          if (!item.feature) return true
          if (this.user && this.user.role === 'admin')
            if (item.feature === 'settings' || item.feature === 'printerSettings') return true
          return (this.enabledFeatures.includes(item.feature))
        })
      },

    },
    methods: {
      changePath(path) {
        if(path)
          this.$router.push({path})
      },
      openStoreSetting() {
        window.cms.socket.emit('getWebShopSettingUrl', webShopUrl => {
          if (webShopUrl) {
            this.iframeSrc = webShopUrl
            this.showIframe = true
          }
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .function {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-image: url("/plugins/pos-plugin/assets/out.png");
    padding: 24px;

    &--up,
    &--down {
      display: grid;
      grid-template-columns: repeat(5, calc(20% - 8px));
      grid-column-gap: 10px;
      grid-row-gap: 40px;
    }

    &--up {
      grid-template-rows: 100%;
      margin-bottom: 40px;
      flex: 0 0 calc(33.33% - 40px);
    }

    &--down {
      grid-template-rows: repeat(2, calc(50% - 20px));
      margin-top: 40px;
      flex: 0 0 calc(66.67% - 40px)
    }

    &-btn {
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0 8px;
      box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);

      & > span {
        word-break: break-word;
      }
    }
  }
</style>
