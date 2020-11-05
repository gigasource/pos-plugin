<template>
  <div class="function">
    <div class="function--up" v-show="computedBtnGroup1 && computedBtnGroup1.length" >
      <div v-for="(btn, i) in computedBtnGroup1" :key="`up_${i}`"
           class="function-btn"
           @click="btn.click">
        <g-icon size="60">{{btn.icon}}</g-icon>
        <span class="mt-3 ta-center">{{btn.title}}</span>
      </div>
    </div>
    <g-divider color="#9e9e9e" v-if="computedBtnGroup1 && computedBtnGroup1.length"/>
    <div class="function--down">
      <div v-for="(btn, i) in computedBtnGroup2" :key="`down_${i}`"
           class="function-btn"
           @click="btn.click">
        <g-icon size="60">{{btn.icon}}</g-icon>
        <span class="mt-3 ta-center">{{btn.title}}</span>
        <div v-if="btn.notification" class="function-noti">
          <g-icon color="white" size="16" class="mr-1">info</g-icon>
          {{btn.notification}}
        </div>
      </div>
    </div>
    <div v-if="demoLicense" :class="['demo-license-warning', dayLeft < 30 ? 'bg-red-lighten-5' : 'bg-blue-lighten-5']">
      <div style="margin: 0 32px 0 8px">
        <p class="fw-700">You are using demo license</p>
        <p :class="['fs-small-2', dayLeft < 30 ? 'text-red' : 'text-grey-darken-1']">{{dayLeft}} day{{dayLeft > 1 && 's'}} left</p>
      </div>
      <g-btn-bs class="fs-small-2" width="100" background-color="white" border-color="#1271FF" @click="viewLicense">View license</g-btn-bs>
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
    injectService:['PosStore:isMobile'],
    props: {
      enabledFeatures: Array,
      user: null,
      view: Object,
    },
    data() {
      const i18n = this.$i18n;
      const { dashboard: { delivery, editMenuCard, editTablePlan, endOfDay, fastCheckout, monthlyReport, orderHistory, printerSettings, settings, staffReport, support, onlineOrdering } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        btnUp: [
          {title: fastCheckout, feature: 'fastCheckout',icon: 'icon-fast-checkout', click: () => this.changePath(this.isMobile ? '/pos-order-3' : '/pos-order-2')},
          {title: delivery, feature: 'delivery', icon: 'icon-order-food', click: () => this.changePath('/pos-order-delivery')}
        ],
        btnDown: [
          {title: orderHistory, feature: 'orderHistory', icon: 'icon-history', click: () => this.changePath('/pos-order-history')},
          {title: settings, feature: 'settings', icon: 'icon-dashboard', click: () => this.changePath('/pos-settings')},
          {title: 'Dine-in Menu', feature: 'editMenuCard', icon: 'icon-menu1',  click: () => this.changePath('/pos-edit-menu-card')},
          {title: 'Delivery Menu', feature: 'editMenuCard', icon: 'icon-menu2',  click: () => this.updateView('DeliveryConfig')},
          {title: endOfDay, feature:'eodReport', icon: 'icon-calendar', click: () => this.changePath('/pos-eod-report')},
          {title: monthlyReport, feature: 'monthlyReport', icon: 'icon-month_report',  click: () => this.changePath('/pos-month-report')},
          {title: staffReport, feature: 'staffReport', icon: 'icon-staff-report', click: () => this.changePath('/pos-staff-report')},
          {title: editTablePlan, feature: 'editTablePlan', icon: 'icon-edit-table-plan',  click: () => this.changePath('/pos-edit-table-plan')},
          {title: printerSettings, feature: 'printerSettings', icon: 'icon-printer-setting',  click: () => this.changePath('/pos-printer-setting')},
          {title: 'Customer', feature: 'customerInfo', icon: 'icon-customer-info',  click: () => this.changePath('/pos-customer')},
          {title: 'Inventory', feature: 'manageInventory', icon: 'icon-inventory', click: () => this.changePath('/pos-inventory') },
          {title: onlineOrdering, feature: 'onlineOrdering', icon: 'icon-online-order-menu', click: this.openStoreSetting },
          // {title: support, icon: 'icon-support-2',  click: () => this.changePath('/pos-support')},
        ],
        showIframe: false,
        iframeWidth: window.innerWidth,
        iframeHeight: window.innerHeight,
        iframeSrc: 'about:blank',
        iframeDragging: false,
        iframeRefreshInterval: null,
        demoLicense: false,
        dayLeft: 14,
        inventoryNotification: 0,
      }
    },
    async created() {
      this.inventoryNotification = await cms.getModel('Inventory').countDocuments({stock: {$lte: 0}})
      cms.socket.on('changeInventory', async () => {
        this.inventoryNotification = await cms.getModel('Inventory').countDocuments({stock: {$lte: 0}})
      })
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

        const items = this.btnDown.filter(item => {
          if (!this.user) return false
          if (!item.feature) return true
          if (this.user.role === 'admin')
            if (item.feature === 'settings' || item.feature === 'printerSettings' || item.feature === 'customerInfo' ) return true
          if (item.feature === 'manageInventory')
            return this.user.role === 'admin' || this.user.viewInventory
          if (item.feature === 'orderHistory')
            return this.user.role === 'admin' || this.user.viewOrderHistory
          if (item.feature === 'onlineOrdering')
            return (this.user.role === 'admin' || this.user.viewOnlineOrderMenu) && this.enabledFeatures.includes(item.feature)
          return this.enabledFeatures.includes(item.feature)
        })

        if(this.inventoryNotification) {
          return items.map(item => {
            if(item.feature === 'manageInventory') {
              return {
                ...item,
                notification: this.inventoryNotification
              }
            }
            return item
          })
        }

        return items
      },

    },
    methods: {
      changePath(path) {
        if(path)
          this.$router.push({path})
      },
      openStoreSetting() {
        window.cms.socket.emit('getWebShopSettingUrl', this.$i18n.locale, webShopUrl => {
          if (webShopUrl) {
            this.iframeSrc = webShopUrl
            this.showIframe = true
          }
        })
      },
      updateView(name) {
        this.$emit('update:view', {name})
      },
      viewLicense() {
        this.dayLeft = this.dayLeft === 59 ? 14 : 59
      }
    }
  }
</script>

<style scoped lang="scss">
  .function {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100%;
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
      /*flex: 0 0 calc(33.33% - 40px);*/
    }

    &--down {
      grid-template-rows: repeat(2, 1fr);
      margin-top: 40px;
      flex: 1;
      /*flex: 0 0 calc(66.67% - 40px)*/
    }

    &-btn {
      width: 100%;
      min-height: 136px;
      background: white;
      position: relative;
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

    &-noti {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      border-radius: 2px;
      background: #FFCB3A;
      padding: 4px;
      color: white;
      font-size: 12px;
    }

    .demo-license-warning {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      padding: 8px;
      align-items: center;
      border-radius: 2px;
    }
  }

  @media screen and (max-width: 1023px) {
    .function {

      &-btn {
        padding-top: 8px;

        & > .g-icon {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
        }

        & > span {
          font-size: 12px;
        }
      }
    }
  }
</style>
