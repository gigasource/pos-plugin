<template>
  <div class="online-order-setting">
    <div class="online-order-setting__title">{{$t('onlineOrder.settings.onlineOrderSettings')}}</div>
    <div class="online-order-setting__content">
      <div class="row-flex" style="flex-wrap: wrap" v-if="computedDevice">
        <div class="col-6">
          <div>{{$t('onlineOrder.settings.status')}}</div>
          <div style="font-style: italic">
            <span>
              {{connected ? 'Connected' : 'Not connected'}}
            </span>

            <span v-if="connected" style="color: #4CAF50"> ({{webshopName}})</span>
          </div>
        </div>

        <div class="col-6">
          <div>{{$t('onlineOrder.settings.webshopUrl')}}</div>
          <div>
            <span style="font-style: italic; color: #536DFE">{{computedDevice.url}}</span>
            <span v-if="!webshopAvailable" style="font-style: italic; color: #F44336"> - {{$t('onlineOrder.settings.notAvailable')}}</span>
          </div>
        </div>

        <div class="col-6 mt-3">
          <g-btn flat background-color="#1271ff" text-color="#fff" :uppercase="false"
                 @click="dialog = true">
            Reset Online Orders
          </g-btn>
        </div>
      </div>
      <g-divider style="margin-top: 20px"/>
    </div>
    <div class="online-order-setting__title">{{$t('onlineOrder.settings.generalSettings')}}</div>
    <div class="online-order-setting__content">
      <div><b>{{$t('onlineOrder.settings.timeToComplete')}} </b></div>
      <g-row>
        <g-grid-select :grid="false" :items="deliveryTimes" v-model="computedDefaultPrepareTime" mandatory>
          <template #default="{item, toggleSelect}">
            <g-btn-bs border-color="#e0e0e0" text-color="black" width="72" height="30"
                      style="margin-top: 8px" @click.stop="toggleSelect(item)"
            >{{item}}
            </g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs border-color="#90CAF9" text-color="black" width="72" height="30" background-color="#E3F2FD"
                      style="margin-top: 8px" @click.stop="toggleSelect(item)"
            >{{item}}
            </g-btn-bs>
          </template>
        </g-grid-select>
      </g-row>

      <div style="margin-top: 16px;"><b>{{$t('onlineOrder.settings.sound')}}</b></div>
      <g-switch :label="$t('onlineOrder.settings.hasSound')" :input-value="computedDevice.sound"
                @change="updateSound"
      />

      <div style="margin-top: 16px;"><b>{{$t('onlineOrder.settings.playNotificationSound')}}</b></div>
      <g-grid-select :grid="false" item-cols="4" :items="soundModes" mandatory :value="computedDevice.soundLoop" @input="updateSoundMode">
        <template #default="{item, toggleSelect}">
          <g-btn-bs border-color="#e0e0e0" text-color="black" height="30"
                    style="margin-top: 8px; white-space: nowrap" @click.stop="toggleSelect(item)"
          >{{item.text}}
          </g-btn-bs>
        </template>
        <template #selected="{item}">
          <g-btn-bs border-color="#90CAF9" text-color="black" height="30" background-color="#E3F2FD"
                    style="margin-top: 8px; white-space: nowrap" @click.stop="toggleSelect(item)"
          >{{item.text}}
          </g-btn-bs>
        </template>
      </g-grid-select>

      <div style="margin-top: 16px;"><b>{{$t('onlineOrder.settings.sorting')}}</b></div>
      <g-grid-select :grid="false" :items="orderSorting" v-model="computedOnlineOrderSorting" mandatory>
        <template #default="{item, toggleSelect}">
          <g-btn-bs border-color="#e0e0e0" text-color="black" width="160" height="30"
                    style="margin-top: 8px" @click.stop="toggleSelect(item)"
          >{{item.text}}
          </g-btn-bs>
        </template>
        <template #selected="{item}">
          <g-btn-bs border-color="#90CAF9" text-color="black" width="160" height="30" background-color="#E3F2FD"
                    style="margin-top: 8px" @click.stop="toggleSelect(item)"
          >{{item.text}}
          </g-btn-bs>
        </template>
      </g-grid-select>
    </div>
    <dialog-form-input v-model="dialog" @submit="checkClearOrderPasswd">
      <template #input>
        <g-text-field-bs label="Enter your passcode" v-model="passcode" clearable/>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import ValuePicker from './ValuePicker';
  import GGridItemSelector from '../FnButton/components/GGridItemSelector';
  import axios from 'axios';

  export default {
    name: "OnlineOrderSetting",
    components: { GGridItemSelector, ValuePicker},
    injectService: ['PosStore:(showErrorSnackbar,showInfoSnackbar)'],
    props: {
      onlineDevice: null,
      defaultPrepareTime: Number,
      onlineOrderSorting: String
    },
    data() {
      return {
        internalDevice: null,
        connected: false,
        deliveryTimes: [15, 30, 45, 60],
        orderSorting: [
          {text: $t('onlineOrder.settings.orderNumber'), value: 'order'},
          {text: $t('onlineOrder.settings.timeToComplete2'), value: 'time'},
        ],
        soundModes: [
          {text: $t('onlineOrder.settings.once'), value: 'none'},
          {text: $t('onlineOrder.settings.twice'), value: 'once'},
          {text: $t('onlineOrder.settings.untilConfirm'), value: 'repeat'},
        ],
        webshopUrl: '',
        webshopAvailable: true,
        pairError: null,
        pairing: false,
        dialog: false,
        passcode: '',
        disableResetBtn: false
      }
    },
    computed: {
      computedDevice: {
        get() {
          if (!this.internalDevice) return {url: this.webshopUrl}
          return Object.assign(this.internalDevice, {url: this.webshopUrl})
        },
        set(value) {
          this.$emit('updateOnlineDevice', value)
        }
      },
      computedDefaultPrepareTime: {
        get() {
          return this.defaultPrepareTime
        },
        set(val) {
          this.$emit('updateDefaultPrepareTime', val)
        }
      },
      computedOnlineOrderSorting: {
        get() {
          return this.onlineOrderSorting
        },
        set(val) {
          this.$emit('updateOnlineOrderSorting', val)
        }
      },
      webshopName() {
        if (this.onlineDevice && this.onlineDevice.store && this.onlineDevice.store.name) {
          return this.onlineDevice.store.name.trim()
        }
        return ''
      }
    },
    watch: {
      onlineDevice(val) {
        this.internalDevice = val

        if (this.internalDevice && this.internalDevice.id) this.connected = true;
      },
      dialog(val) {
        if (val) this.passcode = ''
      }
    },
    methods: {
      updateSound(value) {
        this.computedDevice = Object.assign({}, this.computedDevice, {sound: value})
      },
      updateSoundMode(value) {
        this.computedDevice = Object.assign({}, this.computedDevice, {soundLoop: value})
      },
      async checkClearOrderPasswd() {
        if (this.passcode !== '9999') {
          return this.showErrorSnackbar('Wrong Passcode!')
        }
        this.dialog = false
        await cms.getModel('Order').deleteMany({ online: true })
        this.showInfoSnackbar('Deleted all online orders!')
      }
    },
    mounted() {
      cms.socket.emit('getWebshopUrl', async webshopUrl => {
        this.webshopUrl = webshopUrl

        try {
          await axios.get(`${webshopUrl}/health-check`)
          this.webshopAvailable = true
        } catch (e) {
          this.webshopAvailable = false
        }
      });

      this.$nextTick(() => {
        this.$emit('getOnlineDevice')
      })
    },
    activated() {
      this.$nextTick(() => {
        this.$emit('getOnlineDevice')
      })
    }
  }
</script>

<style scoped lang="scss">
  .online-order-setting {
    width: 100%;
    height: 100%;
    padding: 24px 48px;
    overflow: scroll;

    &__title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    &__content {
      background: #FFFFFF;
      width: 80%;
      display: flex;
      flex-direction: column;
      font-size: 14px;
      margin-bottom: 16px;

      .g-row {
        .bs-tf-wrapper--readonly {
          flex: 1 1;
          margin-left: 0;
        }
      }

      .g-radio-wrapper {
        margin: 0 36px 0 0;

        ::v-deep {
          .g-radio-checkmark {
            &:before, &:after {
              font-size: 12px;
              top: 2px;
            }
          }

          .g-radio-label {
            font-size: 15px;
            margin-left: -6px;
          }

          .g-radio__active .g-radio-label {
            font-weight: 600;
          }
        }

      }

      .g-switch-wrapper {
        margin: 8px 0 0 0;
      }

      .g-btn-bs {
        margin-left: 0;
      }
    }
  }

  @media screen and (max-width: 1023px) {
    .online-order-setting {
      padding: 16px 24px;
    }
  }
</style>
