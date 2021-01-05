<template>
  <div>
    <g-snackbar :value="showMasterDevSnackbar" color="#E57373" absolute timeout="0" class="master-device-snackbar">
      <div class="col-flex align-items-center mb-2 mt-2" style="margin: 0 auto">
        <div class="mb-3" style="font-size: 16px; font-weight: 700">No master device set!</div>
        <g-btn-bs background-color="#1271ff" @click.stop="setMasterDevice">SET THIS DEVICE AS MASTER</g-btn-bs>
      </div>
    </g-snackbar>

    <g-dialog v-model="showLoadingOverlay" content-class="loading-overlay">
      <g-progress-circular color="#fff" indeterminate size="100" width="10"/>
    </g-dialog>
  </div>
</template>

<script>
  import customParseFormat from 'dayjs/plugin/customParseFormat'
  import { getProvided, mobileCheck } from '../logic/commonUtils';
  import _ from 'lodash';

  dayjs.extend(customParseFormat)
  // global filter
  hooks.on('app-created', function () {
    root.config.globalProperties.$filters = {
      formatCurrency(val, decimals = 2) {
        if (!val || isNaN(val) || Math.floor(val) === val) return val
        return val.toFixed(decimals)
      }
    }
  })

  export default {
    name: 'PosStore',
    props: {},
    injectService: [
      'Snackbar:(showSnackbar,closeSnackbar)',
      'VirtualPrinterStore:reportCount',
    ],
    data() {
      return {
        systemDate: new Date(),
        user: null,
        loginPassword: '',
        incorrectPasscode: false,
        timeFormat: this.$t('dates.timeFormat'),
        dateFormat: this.$t('dates.dateFormat'),
        webShopConnected: true,
        online: true,
        storeId: '',
        locale: 'en',
        storeLocale: 'en',
        device: 'Terminal1',
        enabledFeatures: [],
        version: '0.0.0',
        rooms: [],
        pendingReservationsLength: 0,
        reservationBell: null,
        isMobile: false,
        masterClientId: null,
        isIOS: false,
        showVirtualReportInSidebar: false,
        showLoadingOverlay: false,
        pendingOnlineOrderCounter: 0
      }
    },
    computed: {
      dashboardSidebar() {
        return [
          {
            icon: 'icon-restaurant',
            children: this.getDashboardRooms,
            title: this.$t('sidebar.restaurant'),
            feature: 'tablePlan'
          },
          {
            icon: 'icon-manual-table',
            onClick() {
              this.$emit('update:view', {
                name: 'ManualTable',
                params: ''
              })
            },
            title: this.$t('sidebar.manualTable'),
            feature: 'manualTable'
          },
          {
            icon: 'icon-delivery',
            title: this.$t('onlineOrder.onlineOrders'),
            feature: 'onlineOrdering',
            key: 'Dashboard',
            items: [
              {
                icon: 'radio_button_unchecked',
                iconType: 'small',
                onClick() {
                  this.$emit('update:view', {
                    name: 'Dashboard'
                  })
                },
                title: this.$t('onlineOrder.dashboard'),
                key: 'Orders'
              },
              {
                icon: 'radio_button_unchecked',
                iconType: 'small',
                onClick() {
                  this.$emit('update:view', {
                    name: 'Order',
                    params: {
                      status: 'completed'
                    }
                  })
                },
                title: this.$t('onlineOrder.completedOrders')
              },
              {
                icon: 'radio_button_unchecked',
                iconType: 'small',
                onClick() {
                  this.$emit('update:view', {
                    name: 'Order',
                    params: {
                      status: 'declined'
                    }
                  })
                },
                title: this.$t('onlineOrder.declinedOrders')
              },
              {
                icon: 'icon-services',
                onClick() {
                  this.$emit('update:view', {
                    name: 'Services',
                    params: ''
                  })
                },
                title: this.$t('sidebar.services'),
                feature: 'onlineOrdering',
                key: 'Service'
              }
            ],
          },
          {
            icon: 'icon-reservation',
            onClick() {
              this.$emit('update:view', {
                name: 'Reservation',
                params: ''
              })
            },
            title: this.$t('sidebar.reservation'),
            feature: 'reservation',
            key: 'Reservation'
          },
          {
            icon: 'icon-functions',
            onClick() {
              this.$emit('update:view', {
                name: 'Functions',
                params: ''
              })
            },
            title: this.$t('sidebar.functions')
          }
        ]
      },
      computedDashboardSidebar() {
        let sidebar = _.cloneDeep(this.dashboardSidebar)
        if (this.user && this.user.role !== 'admin') {
          if (!this.user.viewOnlineOrderDashboard) {
            sidebar = sidebar.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Dashboard')
          } else if (!this.user.viewOrder) {
            const onlineOrder = sidebar.find(s => s.feature === 'onlineOrdering' && s.items && s.items.length)
            onlineOrder && onlineOrder.items.splice(1, 2)
          }
          if (!this.user.viewOnlineOrderMenu) {
            sidebar = sidebar.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Service')
          }
          if (!this.user.viewReservation) {
            sidebar = sidebar.filter(s => s.feature !== 'reservation' || s.key !== 'Reservation')
          }
        }
        if (this.user && this.enabledFeatures) {
          sidebar = sidebar.filter(item => {
            if (!item.feature) return true
            return this.enabledFeatures.includes(item.feature)
          })
        }

        if (this.showVirtualReportInSidebar) {
          sidebar.push({
            icon: 'icon-printer',
            onClick() {
              this.$emit('update:view', {
                name: 'VirtualPrinter',
                params: ''
              })
            },
            title: 'Virtual Printer'
          })
        }

        return sidebar.map(item => {
          switch (item.key) {
            case 'Reservation':
              return {
                ...item,
                ...this.pendingReservationsLength && { badge: this.pendingReservationsLength + '', badgeColor: '#FF5252' }
              }
            case 'Dashboard':
              const items = item.items.map(i => {
                if(i.key === 'Orders') {
                  return {
                    ...i,
                    ...this.pendingOnlineOrderCounter && { badge: this.pendingOnlineOrderCounter + '', badgeColor: '#FF5252' }
                  }
                }
                return i
              })
              return {
                ...item,
                items
              }
            default:
              return item;
          }
        })
      },
      defaultSidebarPath() {
        function getPath(items, viewName, prefix) {
          for (const item of items) {
            const itemPath = `${prefix}.${items.indexOf(item)}`;
            if (item.title === viewName) {
              return itemPath
            }
            if (item.items) return getPath(item.items, viewName, `${itemPath}.item`)
          }
        }

        let functions = getPath(this.computedDashboardSidebar, this.$t('sidebar.functions'), 'item');
        let orderDashboard = getPath(this.computedDashboardSidebar, this.$t('onlineOrder.dashboard'), 'item');
        return orderDashboard || functions
      },
      showMasterDevSnackbar() {
        // const path = this.$route.path
        // if (path === '/pos-setup' || path === '/pos-login' || path === '/admin') return false
        //
        // if (this.enabledFeatures.includes('tablePlan') || this.enabledFeatures.includes('fastCheckout')) {
        //   return !this.masterClientId
        // }
        return false
      }
    },
    domain: 'PosStore',
    methods: {
      //<!--<editor-fold desc="Login screen">-->
      async login() {
        try {
          this.user = await cms.getModel('PosUser').findOne({ passcode: this.loginPassword }).lean()

          if (this.user) {
            this.loginPassword = ''
            return this.$router.push({ path: `/pos-dashboard` })
          }
        } catch (e) {
          console.error(e)
        }
        this.incorrectPasscode = true
      },
      resetIncorrectPasscodeFlag() {
        if (this.incorrectPasscode) {
          this.incorrectPasscode = false
        }
      },
      completeSetup() {
        this.$router.push('/pos-login')
        cms.socket.emit('getWebshopName')
      },
      skipPairing() {
        this.$router.go(-1)
      },
      async getEnabledFeatures() {
        const enabledFeatures = await cms.getModel('Feature').find({ enabled: true })
        this.enabledFeatures = enabledFeatures.map(item => item.name)
      },
      //<!--</editor-fold>-->
      initSocket() {
        cms.socket.on('updateAppFeature', async (sentryTags, data) => {
          console.debug(sentryTags, '4. Restaurant frontend: received feature update from backend, updating features', JSON.stringify(data));
          await this.getEnabledFeatures()
        })

        cms.socket.emit('get-app-version', version => {
          if (version) this.version = version
        })

        cms.socket.emit('socketConnected', value => {
          this.webShopConnected = value
        })

        cms.socket.on('updateReservationList', async () => {
          await this.getPendingReservationsLength()
          await this.setupReservationBell()
        })

        cms.socket.on('webShopConnected', () => {
          this.webShopConnected = true
          this.getStoreId()
        })

        cms.socket.on('webShopDisconnected', () => {
          this.webShopConnected = false
        })

        cms.socket.on('ringReservationBell', async () => {
          try {
            await this.reservationBell.play()
          } catch (e) {
            this.reservationBell.addEventListener('canplaythrough', () => this.reservationBell.play())
          }
        })

        cms.socket.on('getWebshopName', async () => {
          const posSettings = await cms.getModel('PosSetting').findOne()
          if (posSettings && posSettings.onlineDevice && posSettings.onlineDevice.store) {
            this.storeLocale = posSettings.onlineDevice.store.locale || this.locale || 'en'
          }
        })

        cms.socket.on('unpairDevice', async () => {
          await cms.getModel('PosSetting').findOneAndUpdate({}, { masterClientId: null, masterIp: null })
          this.masterClientId = null
        })

        cms.socket.on('getMasterDevice', id => this.masterClientId = id)

        cms.socket.on('remoteControlInput', data => {
          if (!document.elementFromPoint) {
            console.log('PosStore:remoteControlInput: document.elementFromPoint is not supported')
            return;
          }

          const targetNode = document.elementFromPoint(inputEvent.webPosition.x, inputEvent.webPosition.y);
          // {"type":"mouse","action":"mousedown","position":{"x":270,"y":244}, "webPosition": {"x": 380, "y": 450}}
          // {"type":"mouse","action":"mousemove","position":{"x":270,"y":246}, "webPosition": {"x": 380, "y": 450}}
          // {"type":"mouse","action":"mouseup","position":{"x":270,"y":246}, "webPosition": {"x": 380, "y": 450}}
          // {"type":"keyboard","keyCode":75,"shiftKey":false,"ctrlKey":false,"altKey":false,"metaKey":false}
          const inputEvent = JSON.parse(data);
          switch (inputEvent.type) {
            case 'mouse':
              const mouseEvent = document.createEvent('MouseEvents');
              mouseEvent.initEvent(inputEvent.type, true, true);
              targetNode.dispatchEvent(mouseEvent)
              break;
            case 'keyboard':
              console.log('receive keyboard event')
              // const keyboardEvent = document.createEvent('KeyboardEvent');
              // keyboardEvent.initKeyboardEvent('keypress', true, true, document.defaultView, )
              break;
          }
        })

        cms.socket.on('updateOnlineOrderCounter', async () => {
          await this.getPendingOnlineOrderCounter()
        })
      },
      setMasterDevice() {
        cms.socket.emit('setMasterDevice')
      },
      async changeLocale(locale) {
        await cms.getModel('SystemConfig').updateOne({ type: 'I18n' }, { 'content.locale': locale }, { upsert: true })
        this.locale = locale
        this.$router.go()
      },
      getStoreId() {
        cms.socket.emit('getWebshopId', storeId => {
          this.storeId = storeId || ''
        })
      },
      async updateServerUrl(url) {
        try {
          await cms.getModel('PosSetting').findOneAndUpdate({}, { customServerUrl: url })
        } catch (e) {
          console.error(e)
        }
      },
      async getServerUrl(cb) {
        try {
          const { customServerUrl } = await cms.getModel('PosSetting').findOne()
          cb(customServerUrl)
        } catch (e) {
          console.error(e)
        }
      },
      async showOfflineSnackbar(message) {
        const feature = await cms.getModel('Feature').findOne({ name: 'onlineOrdering' })
        if (!feature || !feature.enabled) return

        const contentFn = () => (
          <div style="margin: 0 auto" class="row-flex align-items-center">
            <g-icon svg size="20">icon-wlan-disconnected-white</g-icon>
            <span class="ml-2">{message}</span>
          </div>);

        this.showSnackbar(contentFn, '#E57373', 0)
      },
      showErrorSnackbar(error, timeout = 5000) {
        const contentFn = () => (
          <div style="margin: 0 auto" class="row-flex align-items-center">
            <span>{error.message || error}</span>
          </div>);

        this.showSnackbar(contentFn, '#E57373', timeout)
      },
      showInfoSnackbar(text, timeout = 5000) {
        const contentFn = () => (
          <div style="margin: 0 auto" class="row-flex align-items-center">
            <span>{text}</span>
          </div>);

        this.showSnackbar(contentFn, '#536dfe', timeout)
      },
      async getPendingReservationsLength() {
        const currentDate = dayjs().startOf('day')
        const reservations = await cms.getModel('Reservation').find({
          status: 'pending',
          date: { $gte: currentDate.toDate(), $lt: currentDate.add(1, 'day').toDate() }
        })
        this.pendingReservationsLength = reservations.length
      },
      async setupReservationBell() {
        const setting = await cms.getModel('PosSetting').findOne()
        if(setting.reservation && setting.reservation.soundNotification) {
          this.reservationBell = new Audio('/plugins/pos-plugin/assets/sounds/reservation-bell.mp3')
        } else {
          this.reservationBell = null
        }
      },
      showVirtualPrinterSidebarItem() {
        console.log('PosStore:showVirtualPrinterSidebarItem')
        this.showVirtualReportInSidebar = true
      },
      toggleOverlay() {
        this.showLoadingOverlay = !this.showLoadingOverlay
      },
      hideVirtualPrinterSidebarItem() {
        console.log('PosStore:hideVirtualPrinterSidebarItem')
        this.showVirtualReportInSidebar = false
      },
      async getRooms() {
        const rooms = await cms.getModel('Room').find()
        this.rooms = _.orderBy(rooms, ['order'], ['asc'])
      },
      getDashboardRooms() {
        if (this.rooms) {
          return this.rooms.map(room => {
            return {
              title: room.name,
              icon: 'radio_button_unchecked',
              iconType: 'small',
              onClick() {
                this.$emit('update:view', {
                  name: 'Restaurant',
                  params: {
                    id: room._id
                  }
                })
              }
            }
          });
        }
        return []
      },
      async getPendingOnlineOrderCounter() {
        this.pendingOnlineOrderCounter = await cms.getModel('Order').countDocuments({
          status: 'inProgress',
          online: true
        })
      }
    },
    async created() {
      if (!this.user) {
        this.user = await cms.getModel('PosUser').findOne({ role: 'admin' })
      }

      window.addEventListener('offline', () => this.online = false)
      window.addEventListener('online', () => this.online = true)
      window.addEventListener('keydown', async e => {
        if (this.$route.path !== '/pos-login') return
        if (e.ctrlKey && e.code === 'KeyL') {
          this.user = await cms.getModel('PosUser').findOne({ role: 'admin' })
          this.$router.push('/pos-dashboard')
        }
      })

      this.isMobile = mobileCheck()
      this.isIOS = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPod') || navigator.userAgent.includes('iPad')
      this.initSocket()
      this.getStoreId()
      this.setDateInterval = setInterval(() => this.systemDate = new Date(), 10000)

      const i18nConfig = cms.getList('SystemConfig').find(i => i.type === 'I18n')
      if (i18nConfig) {
        this.locale = i18nConfig.content.locale
      }
      const posSettings = await cms.getModel('PosSetting').findOne()
      if (posSettings && posSettings.onlineDevice && posSettings.onlineDevice.store) {
        this.storeLocale = posSettings.onlineDevice.store.locale || this.locale || 'en'
      }
      this.masterClientId = posSettings.masterClientId

      if (this.$route) {
        if (this.$route.path === '/pos-login' && this.$route.query.device) {
          this.device = this.$route.query.device
        }
      }
      await this.getEnabledFeatures()
      if (posSettings && posSettings.generalSetting) {
        this.showVirtualReportInSidebar = !!posSettings.generalSetting.useVirtualPrinter
      }

      this.$router.beforeEach((to, from, next) => {
        if (to.path === '/admin' || to.path === '/plugins' || to.path === '/pos-login' || to.path === '/pos-setup') {
          next()
        } else if (!this.user) {
          next('/pos-login')
        } else next()
      })

      await this.getPendingReservationsLength()
      await this.setupReservationBell()
      await this.getRooms()
      cms.socket.on('updateRooms', this.getRooms)
      await this.getPendingOnlineOrderCounter()
    },
    watch: {
      online: {
        handler(val) {
          if (val) {
            this.closeSnackbar && this.closeSnackbar()
          } else {
            this.showOfflineSnackbar(this.$t('settings.noInternet'))
          }
        },
        immediate: true
      },
      webShopConnected(val) {
        if (val) {
          this.closeSnackbar && this.closeSnackbar()
        } else {
          this.showOfflineSnackbar(this.$t('settings.noOnlineOrder'))
        }
      },
    },
    mounted() {
      this.online = navigator.onLine
      if (!this.online) {
        this.showOfflineSnackbar()
      }
      cms.socket.emit('screen-loaded')
    },
    beforeUnmount() {
      this.setDateInterval && clearInterval(this.setDateInterval)
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.methods, this),
        ...getProvided(this.$options.computed, this)
      }
    }
  }
</script>

<style scoped lang="scss">
  .master-device-snackbar {
    top: 0;
    right: 0;

    ::v-deep .g-snack-wrapper {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
</style>

<style>
  .loading-overlay {
    display: flex;
    justify-content: center;
  }
</style>
