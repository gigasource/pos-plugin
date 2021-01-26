
<script>
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const i18n = useI18n()
    const { sidebar, dashboard: { deliveryMenu } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]
    const view = ref('items.0')
    const sidebarData = ref([
      { title: sidebar.user, icon: 'person', isView: true, key: 'user'},
      { title: sidebar.general, icon: 'icon-general_setting', isView: true, key: 'general' },
      {
        title: sidebar.advancedSettings, icon: 'icon-switch', svgIcon: true, key: 'advancedSettings',
        items: [
          { title: sidebar.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'companyInfo' },
          { title: sidebar.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'payment' },
          { title: sidebar.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'tax' },
        ]
      },
      {
        title: sidebar.onlineOrderSettings, icon: 'icon-general_setting',
        items: [
          { title: sidebar.settings, icon: 'radio_button_unchecked', iconType: 'small',  isView: true, key: 'onlineOrderSettings' },
          { title: deliveryMenu, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'deliveryConfig' },
        ]
      },
      { title: sidebar.callSystem, icon: 'icon-telephone', isView: true, key: 'callSystem' },
      { title: sidebar.customerScreen, icon: 'icon-screen', isView: true, key: 'customerScreen' },
    ])
    const onlineDevice = ref(null)
    const defaultPrepareTime = ref(null)
    const onlineOrderSorting = ref(null)

    // todo: implement these functions
    function updateOnlineDevice() {
    }
    function updateDefaultPrepareTime() {
    }
    function updateOnlineOrderSorting() {
    }
    function getOnlineDevice() {
    }
    return () => <>
      <div class="setting">
        <div class="setting-main">
          <pos-settings-screen-sidebar v-model={view.value} sidebarData={sidebarData.value}>
          </pos-settings-screen-sidebar>
          <pos-settings-screen-content value={view.value} sidebar={sidebarData.value} style="flex: 1" v-slots={{
            'general': () => <>
              <view-general>
              </view-general>
            </>,
            'companyinfo': () => <>
              <view-company>
              </view-company>
            </>,
            'payment': () => <>
              <view-payment>
              </view-payment>
            </>,
            'tax': () => <>
              <view-tax>
              </view-tax>
            </>,
            'user': () => <>
              <view-user>
              </view-user>
            </>,
            'onlineordersettings': () => <>
              <online-order-setting onlineDevice={onlineDevice.value} onlineOrderSorting={onlineOrderSorting.value} defaultPrepareTime={defaultPrepareTime.value} onUpdateonlinedevice={updateOnlineDevice} onUpdatedefaultpreparetime={updateDefaultPrepareTime} onUpdateonlineordersorting={updateOnlineOrderSorting} onGetonlinedevice={getOnlineDevice}>
              </online-order-setting>
            </>,
            'callsystem': () => <>
              <call-system>
              </call-system>
            </>,
            'deliveryconfig': () => <>
              <pos-order-delivery-config>
              </pos-order-delivery-config>
            </>,
            'customerscreen': () => <>
              <customer-screen-config>
              </customer-screen-config>
            </>
          }}></pos-settings-screen-content>
        </div>
        <pos-settings-screen-toolbar value={view.value} sidebar={sidebarData.value} v-slots={{
          'payment': () => <>
            <view-payment-toolbar>
            </view-payment-toolbar>
          </>,
          'user': () => <>
            <view-user-toolbar>
            </view-user-toolbar>
          </>,
          'tax': () => <>
            <view-tax-toolbar>
            </view-tax-toolbar>
          </>
        }}></pos-settings-screen-toolbar>
      </div>
    </>
  }
}
</script>

<style scoped lang="scss">
.setting {
  height: 100%;

  &-main {
    height: calc(100% - 64px);
    display: flex;
  }
}
</style>
