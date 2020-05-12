<template>
  <div class="pos-management-setting">
    <!-- BASIC INFO -->
    <div class="pos-management-setting__info">
      <div class="pos-management-setting__title">Basic Information</div>
      <g-select large deletable-chips multiple text-field-component="GTextFieldBs" label="Group"
                :items="groups" class="group"
                item-text="name"
                item-value="_id"
                v-model="computedGroup"/>
      <g-text-field-bs large label="Name" v-model="computedSettingName"/>
      <g-text-field-bs large label="Address" v-model="computedSettingAddress"/>
      <g-select returnObject item-text="name" large text-field-component="GTextFieldBs" label="Country" :items="countries" v-model="computedCountry"/>
    </div>
    
    <!-- ONLINE ORDER STORE -->
    <div class="pos-management-setting__order">
      <div class="pos-management-setting__title">Online Ordering</div>
      <div>
        <p>Online ordering</p>
        <g-radio-group v-model="computedOnlineOrdering" row>
          <g-radio color="#536DFE" label="Active" value="1"/>
          <g-radio color="#536DFE" label="In-active" value="0"/>
        </g-radio-group>
      </div>
      <div>
        <p>WebShop URL</p>
        <div class="pos-management-setting__order--url r">
          <span class="i text-indigo-accent-2">{{ webShopUrlPrefix }}</span>
          <div style="flex: 1; margin-left: 8px">
            <g-text-field-bs dense :class="[aliasErrMessage && 'error']" large :placeholder="_id" :value="alias" @input="updateAliasDebounce"/>
          </div>
          <div v-if="aliasErrMessage" class="error-message">{{aliasErrMessage}}</div>
        </div>
      </div>
      <div class="r">
        <p>Client's domain</p>
        <g-text-field-bs large :class="[clientDomainErrMessage && 'error']" :value="clientDomain" @input="updateClientDomainDebounce"/>
        <div v-if="clientDomainErrMessage" class="error-message">{{clientDomainErrMessage}}</div>
      </div>
    </div>
    
    <!-- DEVICES -->
    <div class="pos-management-setting__device">
      <div class="pos-management-setting__title">Device status</div>
      <template v-if="devices.length === 0">
        <div class="pos-management-setting__device--empty">
          <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
          <p class="text-grey-darken-1 mb-2 mt-2">Device is currently empty.</p>
          <div class="text-indigo-accent-2" style="cursor: pointer" @click="$emit('open:dialogDevice', true)">
            <g-icon style="margin-bottom: 4px; margin-right: -4px" size="18" color="indigo-accent-2">add</g-icon>
            Add New Device
          </div>
        </div>
      </template>
      <template v-else>
        <div class="pos-management-setting__device-content">
          <div class="pos-management-setting__device-content--add">
            <g-icon color="indigo-accent-2" size="60">add</g-icon>
            <p class="text-indigo-accent-2">Add New Device</p>
          </div>
          <div v-for="device in devices">
            <p class="fw-700 mb-2">Name</p>
            <p class="mb-1">Device type: {{device.type}}</p>
            <p class="mb-1">OS: {{device.os}}</p>
            <p class="mb-1">Status: {{device.status}}</p>
            <g-btn-bs elevation="2" text-color="#757575">Disable</g-btn-bs>
            <div class="pos-management-setting__device-content--action">
              <g-tooltip :open-on-hover="true" right speech-bubble color="#000" transition="0.3" remove-content-on-close>
                <template v-slot:activator="{on}">
                  <div class="pos-management-setting__device-content--action-btn mt-1"
                       @mouseenter="on.mouseenter"
                       @mouseleave="on.mouseleave"
                       @click.stop.prevent="$emit('open:dialogDelete', device)">
                    <g-icon color="#FFF" small>mdi-trash-can-outline</g-icon>
                  </div>
                </template>
                <span>Delete</span>
              </g-tooltip>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  
  export default {
    name: "PosManagementSetting",
    props: {
      _id: String,
      settingName: String,
      group: null,
      settingAddress: String,
      onlineOrdering: Boolean,
      alias: String,
      clientDomain: String,
      devices: Array,
      groups: Array,
      country: Object,
      countries: Array,
    },
    injectService: ['PosOnlineOrderManagementStore:(stores)'],
    data() {
      return {
        aliasErrMessage: '',
        clientDomainErrMessage: '',
        countryName: this.country && this.country.name || '',
        groupIds: this.group && this.group.map(g => g._id) || []
      }
    },
    created() {
      this.updateDebounce = _.debounce(this.update, 1000)
      this.updateAliasDebounce = _.debounce(this.updateAlias, 1000)
      this.updateClientDomainDebounce = _.debounce(this.updateClientDomain, 1000)
    },
    computed: {
      webShopUrlPrefix() {
        return`${location.host}/store/`
      },
      computedGroup: {
        get() {
          return this.groupIds
        },
        set(val) {
          this.update({ groups: val })
          this.groupIds = val
        }
      },
      computedSettingName: {
        get() {
          return this.settingName
        },
        set(val) {
          this.updateDebounce({ settingName: val })
        }
      },
      computedSettingAddress: {
        get() {
          return this.settingAddress
        },
        set(val) {
          this.updateDebounce({ settingAddress: val })
        }
      },
      computedOnlineOrdering: {
        get() {
          return this.onlineOrdering ? "1" : "0"
        },
        set(value) {
          this.updateDebounce({ onlineOrdering: value === "1" })
        }
      },
      computedCountry: {
        get() {
          return this.countryName
        },
        set(val) {
          this.update({country: val})
          this.countryName = val.name
        }
      }
    },
    methods: {
      async storeAliasValid(alias) {
        if (_.trim(alias) === '') {
          this.aliasErrMessage = 'WebShop url must not empty!!'
          return false
        }
        if (/([^a-zA-Z0-9\-])/g.exec(alias)) {
          this.aliasErrMessage = 'Valid characters are a-z, A-Z, 0-9 and \'-\' character'
          return false
        }
        const res = (await axios.post('/store/validate-alias', { store: this._id, alias })).data
        if (!res.ok) {
          this.aliasErrMessage = res.message
          return false
        }
        return true
      },
      async updateAlias(value) {
        this.aliasErrMessage = ''
        if (await this.storeAliasValid(value))
          this.update({ alias: value })
      },
      async clientDomainValid(clientDomain) {
        this.clientDomainErrMessage = ''
        if(clientDomain.includes(' ')) {
          this.clientDomainErrMessage = 'Client Domain must not have space in it!'
          return false
        }
        const res = (await axios.post('/store/validate-client-domain', { store: this._id, clientDomain })).data
        if (!res.ok) {
          this.clientDomainErrMessage = res.message
          return false
        }
        return true
      },
      async updateClientDomain(value) {
        if (await this.clientDomainValid(value))
          this.update({clientDomain: value})
      },
      update(change) {
        this.$emit('update', change)
      }
    }
  }
</script>

<style scoped lang="scss">
  .pos-management-setting {
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
    grid-gap: 20px;
    height: calc(100% - 50px);

    & > div {
      background: white;
      border-radius: 4px;
      padding: 24px
    }

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__info {
      grid-area: 1/1/2/2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .group ::v-deep .bs-tf-inner-input-group {
        overflow: auto;

        .input {
          width: calc(100% - 24px);
        }
      }
    }

    &__order {
      grid-area: 2/1/3/2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      &--url {
        display: flex;
        align-items: center;
      }

      .error-message {
        position: absolute;
        bottom: -4px;
        right: 8px;
        color: #ff4452;
        font-size: 12px;
        font-style: italic;
      }

      .error ::v-deep {
        .bs-tf-input-group {
          .bs-tf-inner-input-group {
            border-color: #ff4452 !important;
            box-shadow: 0 0 0 3px rgba(233, 0, 0, 0.25)
          }
        }
      }
    }

    &__device {
      grid-area: 1/2/3/3;

      &--empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        margin-top: 96px;
      }

      &-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        grid-gap: 16px;

        & > div {
          border-radius: 2px;
          background: #FAFAFC;
          border: 1px solid #EFEFEF;
          padding: 12px 16px;
          position: relative;
        }

        &--add {
          border: 2px dashed #BBDEFB !important;
          background: white !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        &--action {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          flex-direction: column;

          &-btn {
            background: #616161;
            border-radius: 2px;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;

            &:hover {
              background: #536DFE;
            }
          }
        }

        .g-btn-bs {
          display: block;
          margin-top: 8px;
        }
      }
    }
  }
</style>
