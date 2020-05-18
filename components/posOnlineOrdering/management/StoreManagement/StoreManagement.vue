<template>
  <div class="store-management">
    <!-- store group table: [consider] move to another vue component -->
    <template v-if="view === 'list'">
      <div class="store-management__title">POS Management</div>
      <div class="store-management__actions-bar">
        <g-text-field-bs prepend-inner-icon="search" placeholder="Search name or branch" v-model="searchText"/>
        <g-menu v-model="showFilterMenu" :close-on-content-click="true" content-class="filter-menu">
          <template v-slot:activator="{on}">
            <g-btn-bs :class="[showFilterMenu && 'btn-sort']" border-color="#e3e5f0" text-color="#757575" icon="sort" @click="on.click">Sort</g-btn-bs>
          </template>
          <div class="filter-options">
            <div :class="['option', { 'option--selected':  orderBy === 'lastUpdated' }]" @click="orderBy = 'lastUpdated'">Last Updated</div>
            <div :class="['option', { 'option--selected':  orderBy === 'firstUpdated' }]" @click="orderBy = 'firstUpdated'">First Updated</div>
            <div :class="['option', { 'option--selected':  orderBy === 'az' }]" @click="orderBy = 'az'">A to Z</div>
            <div :class="['option', { 'option--selected':  orderBy === 'za' }]" @click="orderBy = 'za'">Z to A</div>
          </div>
        </g-menu>
        <g-spacer/>
        <g-btn-bs v-if="manageStorePerm" border-color="#536DFE" icon="add@16" :disabled="storeGroups.length === 0" @click="dialog.newStore = true">Add New Store</g-btn-bs>
        <g-btn-bs v-if="manageGroupPerm" background-color="#536DFE" text-color="white" icon="add@16" @click="dialog.newGroup = true">Add New Group</g-btn-bs>
      </div>
      <div class="store-management__table">
        <div class="store-management__table-header">
          <div class="col-3"></div>
          <div class="row-flex col-9">
            <div class="col-2">Name</div>
            <div class="col-2">Device</div>
            <div class="col-3">Current Version</div>
            <div class="col-4">Update</div>
            <div class="col-1">Action</div>
          </div>
        </div>
        <div class="store-management__table-content">
          <template v-if="storeGroups.length === 0">
            <div class="store-management__table-content--empty">
              <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
              <p class="text-grey-darken-1 mb-2 mt-2">Store is currently empty.</p>
              <div v-if="manageGroupPerm" class="text-indigo-accent-2" style="cursor: pointer" @click="dialog.newGroup = true">
                <g-icon style="margin-bottom: 4px; margin-right: -4px" size="18" color="indigo-accent-2">add</g-icon>
                Add New Group
              </div>
            </div>
          </template>
          <template v-if="storeGroups.length !== 0 && storeManagementViewModel.length === 0">
            <div class="store-management__table-content--empty">
              <p class="text-grey-darken-1">No Store match your search</p>
              <p class="text-grey-darken-1"><span class="fw-700">"{{searchText}}"</span></p>
              <div class="text-indigo-accent-2">Reset Search</div>
            </div>
          </template>
          <template v-else>
            <pos-management-group
                v-for="(group, i) in storeManagementViewModel"
                v-bind="group"
                :key="`group_${i}`"
                :app-items="appItems"
                @update:groupName="changeStoreGroupName"
                @delete:group="deleteStoreGroup"
                @update:deviceAppVersion="updateDeviceAppVersion"
                @open:editDeviceFeatureDialog="showFeatureControlDialog"
                @open:editDeviceNameDialog="showEditDeviceNameDialog"
                @open:deleteDeviceDialog="showDeleteDeviceDialog"
                @view:settings="viewStoreSetting($event)"
                @open:pairDeviceDialog="showPairDeviceDialog"
                @updateStores="loadStores()"/>
          </template>
        </div>
      </div>
    </template>

    <!-- setting [consider] move to another vue component -->
    <template v-else-if="view === 'settings' && settingsPerm">
      <div class="store-management__breadcrumbs">
        <span @click="view = 'list'">POS Management</span>
        <g-icon class="mx-2" size="12">fas fa-angle-double-right</g-icon>
        <span>Settings</span>
      </div>
      <!-- TODO: using v-bind instead-->
      <pos-management-setting
          :_id="selectedStore._id"
          :setting-name="selectedStore.settingName"
          :setting-address="selectedStore.settingAddress"
          :alias="selectedStore.alias"
          :client-domain="selectedStore.clientDomain"
          :group="selectedStore.groups"
          :online-ordering="selectedStore.onlineOrdering"
          :devices="selectedStore.devices"
          :groups="storeGroups"
          :country="selectedStore.country"
          :countries="countries"
          @update="updateStore(selectedStore._id, $event)"/>
    </template>

    <!-- dialogs -->
    <dialog-new-group v-if="manageGroupPerm && storeGroups && dialog.newGroup" v-model="dialog.newGroup" @submit="addGroup($event)" :groups="storeGroups"/>
    <dialog-new-store v-if="manageStorePerm && storeGroups && dialog.newStore" v-model="dialog.newStore" @submit="addStore($event)" :groups="storeGroups" :countries="countries"/>
    <dialog-delete-item v-if="settingsPerm && dialog.deleteDevice" v-model="dialog.deleteDevice" type="device" @confirm="deleteDevice"/>
    <dialog-pair-new-device v-if="selectedStore && dialog.pairNewDevice" v-model="dialog.pairNewDevice" :store="selectedStore"/>
    <dialog-pair-new-device-success v-if="selectedStore && dialog.pairNewDeviceSuccess" v-model="dialog.pairNewDeviceSuccess" :store="selectedStore"/>
    <dialog-feature-control
        v-if="selectedStore && selectedDevice && dialog.featureControl"
        v-model="dialog.featureControl"
        :store="selectedStore"
        :device="selectedDevice"
        @cancel="closeFeatureControlDialog"
        @save="updateDeviceAppFeature"/>
    <dialog-edit-device-name
        v-if="selectedDevice && dialog.editDeviceName"
        v-model="dialog.editDeviceName"
        :device="selectedDevice"
        @cancel="closeEditDeviceNameDialog"
        @save="updateDeviceName"/>
  </div>
</template>
<script>
  export default {
    name: 'StoreManagement',
    props: {},
    data: function () {
      return {
        view: 'list',
        showFilterMenu: false,
        selectedStore: null,
        deviceIdList: [],
        selectedDevice: null,
        dialog: {
          newGroup: false,
          newStore: false,
          deleteDevice: false,
          featureControl: false,
          pairNewDevice: false,
          pairNewDeviceSuccess: false,
          editDeviceName: false,
        },
        countries: [
          {name: 'Germany', locale: 'de'},
          {name: 'United State', locale: 'en'},
          {name: 'United Kingdom', locale: 'en'},
          {name: 'Australia', locale: 'en'},
          {name: 'Canada', locale: 'en'},
          {name: 'France', locale: 'fr'},
          {name: 'Italy', locale: 'it'},
          {name: 'Singapore', locale: 'en'},
        ],
      }
    },
    injectService: [
      // view model
      'PosOnlineOrderManagementStore:(storeManagementViewModel,searchText,orderBy)',
      // store groups
      'PosOnlineOrderManagementStore:(storeGroups,loadStoreGroups,addGroup,changeStoreGroupName,deleteStoreGroup)',
      // stores
      'PosOnlineOrderManagementStore:(stores,loadStores,addStore,removeStore,updateStore,checkDeviceOnlineStatus)',
      // devices
      'PosOnlineOrderManagementStore:(addDevice,removeDevice,updateDevice,updateDeviceFeatures,updateDeviceAppVersion,showMessage)',
      // app
      'PosOnlineOrderManagementStore:(apps,appItems)',
      // store management permissions
      'PermissionStore:(manageGroupPerm,manageStorePerm,settingsPerm)'
    ],
    mounted() {
      window.cms.socket.on('reloadStores', storeId => {
        const storeIdList = _.flatten(this.storeManagementViewModel.map(e => e.stores)).map(e => e._id)
        if (storeIdList.includes(storeId)) this.loadStores()
      })

      window.cms.socket.on('updateDeviceStatus', this.checkDeviceOnlineStatus)

      this.$watch('storeManagementViewModel', val => {
        const stores = _.flatten(val.map(e => e.stores))
        const devices = _.flatten(stores.map(store => store.devices))
        const deviceIds = devices.map(device => device._id)
        this.deviceIdList = _.uniq(this.deviceIdList.concat(deviceIds))

        // Duplicated IDs will be filtered on backend so it's OK to send the same IDs again
        window.cms.socket.emit('watchDeviceStatus', this.deviceIdList)
      })
    },
    beforeDestroy() {
      window.cms.socket.off('updateDeviceStatus')
      window.cms.socket.emit('unwatchDeviceStatus', this.deviceIdList)
    },
    computed: {
      // selectedStore() {
      //   if (this.selectedStoreId)
      //     return _.find(this.stores, store => store._id === this.selectedStoreId)
      // },
    },
    methods: {
      setSelectedStore(store) {
        this.$set(this, 'selectedStore', store)
      },
      setSelectedDevice(device) {
        this.$set(this, 'selectedDevice', device)
      },

      viewStoreSetting(store) {
        this.setSelectedStore(store)
        this.view = 'settings'
      },

      // pair device
      showPairDeviceDialog(store) {
        this.setSelectedStore(store)
        this.dialog.pairNewDevice = true
      },

      // delete device
      showDeleteDeviceDialog(device) {
        this.dialog.deleteDevice = true
        this.setSelectedDevice(device)
      },
      async deleteDevice() {
        await this.removeDevice(this.selectedDevice._id)
        this.setSelectedDevice(null)
      },

      // device features
      showFeatureControlDialog(store, device) {
        this.setSelectedStore(store)
        this.setSelectedDevice(device)
        this.dialog.featureControl = true
      },
      closeFeatureControlDialog() {
        this.dialog.featureControl = false
      },
      updateDeviceAppFeature(features) {
        this.updateDeviceFeatures(this.selectedDevice._id, features, (message) => {
          this.dialog.featureControl = false
          this.showMessage(message, false)
        })
      },

      // device name
      showEditDeviceNameDialog(device) {
        this.setSelectedDevice(device)
        this.dialog.editDeviceName = true
      },
      closeEditDeviceNameDialog() {
        this.dialog.editDeviceName = false
      },
      updateDeviceName(_id, name) {
        this.updateDevice(_id, { name })
      },
    }
  }
</script>
<style scoped lang="scss">
  .store-management {
    height: 100%;

    .btn-sort {
      background: #FFFFFF;
      border: 1px solid #536DFE !important;
      border-radius: 2px;
      color: #536DFE !important;
    }

    &__title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 24px;
    }

    &__breadcrumbs {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 24px;

      span:first-child {
        color: #9e9e9e;
        cursor: pointer;
      }
    }

    &__actions-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      margin-right: -8px;

      .bs-tf-wrapper {
        width: auto;

        ::v-deep .bs-tf-input-group {
          background: white;
        }
      }
    }

    &__table {
      height: calc(100% - 120px);
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;

      &-header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;
      }

      &-content {
        height: calc(100% - 38px);
        overflow: hidden scroll;

        &--empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-items: center;
          margin-top: 64px;
        }
      }
    }
  }

  .filter-options {
    background: #FFFFFF;
    border: 1px solid #D3D3D3;
    border-radius: 2px;

    .option {
      background-color: #FFF;
      font-size: 14px;
      line-height: 20px;
      padding: 12px 16px;
      text-align: left;
      user-select: none;
      cursor: pointer;
      color: #201F2B;

      &--selected {
        background-color: #EFEFEF;
      }

      &:hover {
        background-color: #EFEFEF;
      }
    }
  }
</style>
