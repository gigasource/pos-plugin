<template>
  <div class="h-100 r">
    <div class="configuration">
      <div class="config">
        <p class="title mb-3">{{$t('settings.thermalPrinter')}}</p>
        <div class="row-flex flex-wrap">
          <div v-for="(type, i) in printerTypes" :key="i" :class="['printer', selectedPrinterType === type && 'printer__active']" @click="select(type)">
            {{type.name}}
          </div>
          <div class="printer" @click="resetPrinter">
            {{$t('settings.reset')}}
          </div>
        </div>
      </div>
      <g-divider inset/>
      <div v-if="selectedPrinterType && selectedPrinterType.value === 'ip'" class="config">
        <p class="title">{{$t('settings.ipAddress')}}</p>
        <div class="row-flex mx-2">
          <g-text-field solo outlined dense v-model="ipAddress" @click="showKeyboard = true">
            <template v-slot:append-inner>
              <g-icon svg style="cursor: pointer" @click.stop.prevent="showKeyboard = !showKeyboard">icon-keyboard</g-icon>
            </template>
          </g-text-field>
          <!--          <g-btn :uppercase="false" outlined height="auto" class="mt-3 mb-4">-->
          <!--            {{$t('settings.setupPrinter')}}-->
          <!--          </g-btn>-->
        </div>
        <g-btn :uppercase="false" text-color="white" background-color="blue accent 3" class="ml-2">
          {{$t('settings.testPrinter')}}
        </g-btn>
      </div>
    </div>
    <div v-if="showKeyboard" class="keyboard">
      <pos-keyboard-full v-model="ipAddress"/>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'viewHardware',
    injectService: [
      'SettingsStore:(thermalPrinter, getThermalPrinter, updateThermalPrinter)',
    ],
    data() {
      return {
        hardware: null,
        printerTypes: [
          { name: 'Network Printer', value: 'ip' },
          { name: 'Serial Port', value: 'com' },
          { name: 'USB', value: 'usb' }
        ],
        selectedPrinterType: null,
        showKeyboard: false,
        thermalPrinter: null,
      }
    },
    computed: {
      ipAddress: {
        get() {
          if (this.thermalPrinter) {
            return this.thermalPrinter.ip
          }
          return ''
        },
        set(val) {
          if (this.thermalPrinter) {
            this.thermalPrinter['ip'] = val
          } else {
            this.thermalPrinter = {
              printerType: 'ip',
              ip: val
            }
          }
        }
      }
    },
    methods: {
      select(type) {
        this.selectedPrinterType = type;
        if (this.thermalPrinter) {
          this.thermalPrinter.printerType = type.value;
        } else {
          this.thermalPrinter = {
            printerType: type.value
          }
        }
      },
      resetPrinter() {
        this.selectedPrinterType = null;
        if (this.thermalPrinter) {
          this.thermalPrinter.printerType = null;
        } else {
          this.thermalPrinter = {
            printerType: null
          }
        }
      },
      getThermalPrinter() {
        console.error('SettingsStore:getThermalPrinter was not injected')
      },
      updateThermalPrinter() {
        console.error('SettingsStore:updateThermalPrinter was not injected')
      }
    },
    created() {
      setTimeout(async () => {
        await this.getThermalPrinter();
        if (this.thermalPrinter) {
          this.selectedPrinterType = this.printerTypes.find(t => t.value === this.thermalPrinter.printerType)
        }
      }, 100)
    },
    watch: {
      thermalPrinter: {
        handler(newVal) {
          this.updateThermalPrinter(newVal._id, newVal).then(res => {})
        },
        deep: true
      }
    },
  }
</script>

<style scoped lang="scss">
  .hardware-list {
    width: 25%;
    overflow-y: auto;
    border-right: 1px solid rgba(0, 0, 0, 0.12);

    .g-list {
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);

      ::v-deep .g-list-item-text {
        font-size: 13px;
        line-height: 16px;
        color: #4D4D4E;
        margin: 24px 8px;
      }

      ::v-deep .g-list-item__active:hover {
        background: rgba(242, 242, 242, 0.5);
      }

      ::v-deep .list-item__active {
        border-right: 5px solid #1271ff;
        background: rgba(242, 242, 242, 0.5);
        transition: none;

        &::before {
          background: rgba(242, 242, 242, 0.5);
        }
      }
    }
  }

  .configuration {
    width: 75%;

    .config {
      padding: 16px 8px;

      .title {
        color: #1D1D26;
        font-weight: 700;
        font-size: 16px;
        line-height: 20px;
        margin-left: 8px;
      }

      .printer {
        width: calc(33% - 16px);
        flex: 0 0 calc(33% - 16px);
        margin: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F0F0F0;
        border: 1px solid #979797;
        border-radius: 2px;
        padding: 20px;
        color: #4D4D4E;
        font-size: 13px;
        line-height: 16px;

        &__active {
          border-color: #1271ff;
        }
      }

      .g-tf-wrapper.g-tf__outlined.g-tf__solo {
        box-shadow: none;
        margin-right: 16px;

        ::v-deep fieldset {
          border-color: #979797;
          border-radius: 2px;

          &:focus-within {
            border-width: 1px;
          }
        }

        ::v-deep .g-tf {
          border-radius: 2px;
          box-shadow: none;

          .g-tf-input {
            color: #4D4D4E;
            font-size: 13px;
            padding: 10px 8px !important;
          }
        }
      }

      .g-btn.g-btn__outlined {
        border-color: #979797;
        width: calc(33% - 16px);
        margin-right: 1%;

        ::v-deep .g-btn__content {
          color: #4D4D4E;
          font-size: 13px;
        }
      }
    }
  }

  .keyboard {
    position: absolute;
    bottom: 0;
    background-color: #efefef;
    padding: 8px;
    width: 100%;
    box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.15);
  }
</style>
