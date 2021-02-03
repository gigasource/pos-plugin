<template>
  <div class="setting">
    <div class="setting-main">
      <pos-settings-screen-sidebar v-model="view" :sidebar-data="sidebarData"/>
      <pos-settings-screen-content :value="view" :sidebar="sidebarData" style="flex: 1">
        <template v-slot:user>
          <view-user/>
        </template>
        <template v-slot:onlineOrderSettings>
          <online-order-setting
              :online-device="onlineDevice"
              :online-order-sorting="onlineOrderSorting"
              :default-prepare-time="defaultPrepareTime"
              @updateOnlineDevice="updateOnlineDevice"
              @updateDefaultPrepareTime="updateDefaultPrepareTime"
              @updateOnlineOrderSorting="updateOnlineOrderSorting"
              @getOnlineDevice="getOnlineDevice"/>
        </template>
        <template v-slot:callSystem>
          <call-system/>
        </template>
        <template v-slot:deliveryConfig>
          <pos-order-delivery-config/>
        </template>
        <template v-slot:customerScreen>
          <customer-screen-config/>
        </template>
      </pos-settings-screen-content>
    </div>

  </div>
</template>

<script>
  import PosSettingsScreenContent from '../Settings/PosSettingsScreenContent'
  import PosSettingsScreenSidebar from '../Settings/PosSettingsScreenSidebar';
  import CallSystem from '../OnlineOrder/CallSystem';
  import OnlineOrderSetting from '../OnlineOrder/OnlineOrderSetting';
  import PosOrderDeliveryConfig from '../posOrder/PosOrderDeliveryConfig';
  import CustomerScreenConfig from '../CustomerScreen/CustomerScreenConfig';

  export default {
    name: "Settings",
    injectService: [
        'SettingsStore:(onlineDevice, defaultPrepareTime, onlineOrderSorting, updateOnlineDevice, updateDefaultPrepareTime, updateOnlineOrderSorting, getOnlineDevice)'
    ],
    components: {
      PosSettingsScreenContent, PosSettingsScreenSidebar,
      CallSystem,
      OnlineOrderSetting,
      PosOrderDeliveryConfig, CustomerScreenConfig
    },
    data() {
      const i18n = this.$i18n;
      const { sidebar, dashboard: { deliveryMenu } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        view: 'items.0',
        sidebarData: [
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
        ],
        // inject
        onlineDevice: null,
        defaultPrepareTime: null,
        onlineOrderSorting: null
      }
    },
    methods: {
      updateOnlineDevice() {
        console.error('SettingsStore:updateOnlineDevice was not injected')
      },
      updateDefaultPrepareTime() {
        console.error('SettingsStore:updateDefaultPrepareTime was not injected')
      },
      updateOnlineOrderSorting() {
        console.error('SettingsStore:updateOnlineOrderSorting was not injected')
      },
      getOnlineDevice() {
        console.error('SettingsStore:getOnlineDevice was not injected')
      }
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
