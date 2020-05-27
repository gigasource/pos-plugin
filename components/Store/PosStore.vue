<template>
  <fragment/>
</template>

<script>
  import customParseFormat from 'dayjs/plugin/customParseFormat'
  import { getProvided } from '../logic/commonUtils';

  dayjs.extend(customParseFormat)

  export default {
    name: 'PosStore',
    props: {},
    injectService: ['Snackbar:(showSnackbar,closeSnackbar)'],
    data() {
      return {
        systemDate: new Date(),
        user: null,
        loginPassword: '',
        incorrectPasscode: false,
        timeFormat: this.$t('dates.timeFormat'),
        dateFormat: this.$t('dates.dateFormat'),
        webShopConnected: false,
        online: false,
        storeId: '',
        locale: 'en',
        device: 'Terminal1',
        enabledFeatures: [],
        version: '0.0.0',
        dashboardSidebar: [
          {
            icon: 'icon-restaurant',
            children() {
              const rooms = this.$getService('RoomStore').rooms
              const result = rooms.map(room => {
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

              return result;
            },
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
                title: this.$t('onlineOrder.dashboard')
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
              }
            ],
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
          },
          {
            icon: 'icon-services',
            onClick() {
              this.$emit('update:view', {
                name: 'Services',
                params: ''
              })
            },
            title: 'Services',
            feature: 'onlineOrdering',
            key: 'Service'
          }
        ],
      }
    },
    computed: {
      computedDashboardSidebar() {
        let sidebar = _.cloneDeep(this.dashboardSidebar)
        if (this.user && this.user.role !== 'admin') {
          if (!this.user.viewOnlineOrderDashboard) {
            sidebar = sidebar.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Dashboard')
          } else if (!this.user.viewOrder) {
            const onlineOrder = sidebar.find(s => s.feature === 'onlineOrdering' && s.items && s.items.length)
            onlineOrder && onlineOrder.items.splice(1, 2)
          }
          if(!this.user.viewOnlineOrderMenu) {
            sidebar = sidebar.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Service')
          }
        }
        if (this.user && this.enabledFeatures) {
          return sidebar.filter(item => {
            if (!item.feature) return true
            return this.enabledFeatures.includes(item.feature)
          })
        }
        return sidebar
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
      }
    },
    domain: 'PosStore',
    methods: {
      //<!--<editor-fold desc="Login screen">-->
      async login() {
        try {
          const posSetting = await cms.getModel('PosSetting').findOne();
          this.user = posSetting.user.find(user => user.passcode === this.loginPassword)

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
        cms.socket.on('updateAppFeature', async () => {
          await this.getEnabledFeatures()
        })

        cms.socket.emit('get-app-version', version => {
          if (version) this.version = version
        })

        cms.socket.emit('socketConnected', value => {
          this.webShopConnected = value
        })

        cms.socket.on('webShopConnected', () => {
          this.webShopConnected = true
          this.getStoreId()
        })

        cms.socket.on('webShopDisconnected', () => {
          this.webShopConnected = false
        })
      },
      async changeLocale(locale) {
        await cms.getModel('SystemConfig').updateOne({ type: 'I18n'}, {'content.locale': locale }, { upsert: true })
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
          await cms.getModel('PosSetting').findOneAndUpdate({}, {customServerUrl: url})
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
      showOfflineSnackbar() {
        const contentFn = () => (
          <div style="margin: 0 auto" class="row-flex align-items-center">
            <g-icon svg size="20">icon-wlan-disconnected-white</g-icon>
            <span class="ml-2">No Internet</span>
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
      }
    },
    async created() {
      window.addEventListener('offline', () => this.online = false)
      window.addEventListener('online', () => this.online = true)

      window.addEventListener('keydown', (e) => {
        if (this.$route.path !== '/pos-login') return
        if (e.ctrlKey && e.code === 'KeyL') {
          this.user = cms.getList('PosSetting')[0].user.find(user => user.role === 'admin')
          this.$router.push('/pos-dashboard')
        }
      })

      this.initSocket()
      this.getStoreId()
      this.setDateInterval = setInterval(() => this.systemDate = new Date(), 10000)

      const i18nConfig = cms.getList('SystemConfig').find(i => i.type === 'I18n')
      if (i18nConfig) {
        this.locale = i18nConfig.content.locale
      }

      if (this.$router && this.$router.currentRoute) {
        const {currentRoute} = this.$router
        if (currentRoute.path === '/pos-login' && currentRoute.query.device) {
          this.device = currentRoute.query.device
        }
      }

      await this.getEnabledFeatures()

      this.$router.beforeEach((to, from, next) => {
        if (to.path === '/admin' || to.path === '/plugins' || to.path === '/pos-login' || to.path === '/pos-setup') {
          next()
        } else if (!this.user) {
          next('/pos-login')
        } else next()
      })
    },
    watch: {
      online(val) {
        if (val) {
          this.closeSnackbar()
        } else {
          this.showOfflineSnackbar()
        }
      }
    },
    mounted() {
      this.online = navigator.onLine
      if (!this.online) {
        this.showOfflineSnackbar()
      }
    },
    beforeDestroy() {
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

<style scoped>

</style>
