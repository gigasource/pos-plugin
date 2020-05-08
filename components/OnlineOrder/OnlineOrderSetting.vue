<template>
  <div class="online-order-setting">
    <div class="online-order-setting__title">{{$t('onlineOrder.settings.onlineOrderSettings')}}</div>
    <div class="online-order-setting__content">
      <div class="row-flex" v-if="computedDevice">
        <div class="col-6">
          <div>{{$t('onlineOrder.settings.status')}}</div>
          <div style="font-style: italic">
            <span>
              {{connected ? 'Connected' : 'Not connected'}}
            </span>

            <span v-if="connected" style="color: #4CAF50"> ({{this.webshopName}})</span>
          </div>
        </div>

        <div class="col-6">
          <div>{{$t('onlineOrder.settings.webshopUrl')}}</div>
          <div>
            <span style="font-style: italic; color: #536DFE">{{computedDevice.url}}</span>
            <span v-if="!webshopAvailable" style="font-style: italic; color: #F44336"> - {{$t('onlineOrder.settings.notAvailable')}}</span>
          </div>
        </div>
      </div>
      <g-btn-bs v-if="connected" large background-color="#424242" text-color="#FFF" style="margin-top: 24px;"
                @click.stop="dialog.disconnect = true">
        {{$t('onlineOrder.settings.unpair')}}
      </g-btn-bs>
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

      <div style="margin-top: 16px;"><b>Sound</b></div>
      <g-switch :label="$t('onlineOrder.settings.hasSound')" :input-value="computedDevice.sound"
                @change="updateSound"
      />

      <div style="margin-top: 16px;"><b>Play notification sound</b></div>
      <g-grid-select :grid="false" :items="soundModes" mandatory :value="computedDevice.soundLoop" @input="updateSoundMode">
        <template #default="{item, toggleSelect}">
          <g-btn-bs border-color="#e0e0e0" text-color="black" height="30"
                    style="margin-top: 8px;" @click.stop="toggleSelect(item)"
          >{{item.text}}
          </g-btn-bs>
        </template>
        <template #selected="{item}">
          <g-btn-bs border-color="#90CAF9" text-color="black" height="30" background-color="#E3F2FD"
                    style="margin-top: 8px;" @click.stop="toggleSelect(item)"
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

<!--      <div style="margin-top: 16px;"><b>Auto decline order</b></div>-->
<!--      <div>-->
<!--        <g-switch label="Auto decline order after (min)"/>-->
<!--        <g-text-field-bs></g-text-field-bs>-->
<!--      </div>-->
    </div>

    <dialog-connect v-model="dialog.connect" :error="pairError" :pairing="pairing" @confirm="connect"/>
    <dialog-disconnect v-model="dialog.disconnect" @confirm="disconnect"/>
  </div>
</template>

<script>
  import ValuePicker from './ValuePicker';
  import GGridItemSelector from '../FnButton/components/GGridItemSelector';
  import axios from 'axios';

  export default {
    name: "OnlineOrderSetting",
    components: {GGridItemSelector, ValuePicker},
    props: {
      onlineDevice: null,
      defaultPrepareTime: Number,
      onlineOrderSorting: String
    },
    data() {
      return {
        internalDevice: null,
        connected: false,
        dialog: {
          connect: false,
          disconnect: false
        },
        deliveryTimes: [15, 30, 45, 60],
        orderSorting: [
          {text: 'Order Number', value: 'order'},
          {text: 'Time to Complete', value: 'time'},
        ],
        soundModes: [
          {text: 'Once', value: 'none'},
          {text: 'Twice', value: 'once'},
          {text: 'Until Confirm', value: 'repeat'},
        ],
        webshopUrl: '',
        webshopName: '',
        webshopAvailable: true,
        pairError: null,
        pairing: false,
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
      }
    },
    watch: {
      onlineDevice(val) {
        this.internalDevice = val

        if (this.internalDevice && this.internalDevice.id) this.connected = true;
      }
    },
    methods: {
      async connect(pairingCode) {
        this.pairing = true
        this.pairError = null

        this.$emit('registerOnlineOrder', pairingCode, (error, deviceId) => {
          this.pairing = false

          if (error) {
            this.connected = false
            this.pairError = error
          } else {
            this.computedDevice = {
              id: deviceId,
              url: this.webshopUrl,
              sound: this.internalDevice.sound,
            }

            this.connected = true
            this.dialog.connect = false
            this.pairError = null
            this.getWebshopName()
          }
        })
      },
      disconnect() {
        this.$emit('unregisterOnlineOrder', () => {
          this.computedDevice = {
            id: null,
            url: this.webshopUrl,
            sound: this.internalDevice.sound,
          }

          this.connected = false
          this.webshopName = ''
        })
      },
      updateSound(value) {
        this.computedDevice = Object.assign({}, this.computedDevice, {sound: value})
      },
      updateSoundMode(value) {
        this.computedDevice = Object.assign({}, this.computedDevice, {soundLoop: value})
      },
      openConnectDialog() {
        this.dialog.connect = true
        this.pairError = null
        this.pairing = false
      },
      getWebshopName() {
        window.cms.socket.emit('getWebshopName', webshopName => {
          if (!webshopName) this.webshopName = 'Web shop name not available'
          else this.webshopName = webshopName
        })
      }
    },
    mounted() {
      this.getWebshopName()

      window.cms.socket.emit('getWebshopUrl', async webshopUrl => {
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
        width: 25%;
      }
    }
  }
</style>
