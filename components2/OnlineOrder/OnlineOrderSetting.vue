<script>
import { useI18n } from 'vue-i18n';
import { ref, computed, onBeforeMount, onActivated } from 'vue'
import axios from 'axios';

export default {
  props: {
    onlineDevice: null,
    defaultPrepareTime: Number,
    onlineOrderSorting: String
  },
  setup(props, { emit }) {
    const onlineDevice = ref(props.onlineDevice)
    const defaultPrepareTime = ref(props.defaultPrepareTime())
    const onlineOrderSorting = ref(props.onlineOrderSorting)
    const { t, locale } = useI18n()
    const internalDevice = ref(null)
    const connected = ref(false)
    const deliveryTimes = [15, 30, 45, 60]
    const orderSorting = [
      { text: t('onlineOrder.settings.orderNumber'), value: 'order' },
      { text: t('onlineOrder.settings.timeToComplete2'), value: 'time' },
    ]
    const soundModes = [
      { text: t('onlineOrder.settings.once'), value: 'none' },
      { text: t('onlineOrder.settings.twice'), value: 'once' },
      { text: t('onlineOrder.settings.untilConfirm'), value: 'repeat' },
    ]
    const webshopUrl = ref('')
    const webshopAvailable = ref(true)
    const pairError = ref(null)
    const pairing = ref(false)
    const dialog = ref(false)
    const passcode = ref('')
    const disableResetBtn = ref(false)
    const disableDataBtn = ref(false)
    const isTemplateData = ref(false)
    const isMasterDevice = ref(false)
    const computedDevice = computed({
      get() {
        if (!internalDevice.value) return { url: webshopUrl.value }
        return Object.assign(internalDevice.value, { url: webshopUrl.value })
      },
      set(value) {
        emit('updateOnlineDevice', value)
      }
    })
    const computedDefaultPrepareTime = computed({
      get() {
        return defaultPrepareTime.value
      },
      set(val) {
        emit('updateDefaultPrepareTime', val)
      }
    })
    const computedOnlineOrderSorting = computed({
      get() {
        return onlineOrderSorting.value
      },
      set(val) {
        emit('updateOnlineOrderSorting', val)
      }
    })
    const webshopName = computed(() => {
      if (onlineDevice.value && onlineDevice.store.value && onlineDevice.value.store.name) {
        return onlineDevice.value.store.name.trim()
      }
      return ''
    })

    function updateSound(value) {
      computedDevice.value = Object.assign({}, computedDevice.value, { sound: value })
    }

    function updateSoundMode(value) {
      computedDevice.value = Object.assign({}, computedDevice.value, { soundLoop: value })
    }

    //showErrorSnackbar
    async function checkClearOrderPasswd() {
      if (passcode.value !== '9999') {
        return showErrorSnackbar('Wrong Passcode!')
      }
      dialog.value = false
      await cms.getModel('Order').deleteMany({ online: true })
      showInfoSnackbar('Deleted all online orders!')
    }

    function uploadData() {
      disableDataBtn.value = true
      cms.socket.emit('export-demo-data', isTemplateData, () => {
        disableDataBtn.value = false
      })
    }

    function downloadData() {
      disableDataBtn.value = true
      cms.socket.emit('import-demo-data', () => {
        disableDataBtn.value = false
      })
    }

    async function getMasterStatus() {
      const posSettings = await cms.getModel('PosSetting').findOne().lean()
      if (posSettings.onlineDevice && posSettings.onlineDevice.id) {
        return posSettings.onlineDevice.id === posSettings.masterClientId
      }
    }

    onBeforeMount(async () => {
      cms.socket.emit('getWebshopUrl', async webshopUrl => {
        webshopUrl.value = webshopUrl
        try {
          await axios.get(`${webshopUrl}/health-check`)
          webshopAvailable.value = true
        } catch (e) {
          webshopAvailable.value = false
        }
      });
      emit('getOnlineDevice')
      isMasterDevice.value = await getMasterStatus()
    })
    onActivated(() => {
      emit('getOnlineDevice')
    })


    return () =>
        <div class="online-order-setting">
          <div class="online-order-setting__title">
            {t('onlineOrder.settings.onlineOrderSettings')} </div>
          <div class="online-order-setting__content">
            {
              (computedDevice.value) &&
              <div class="row-flex" style="flex-wrap: wrap">
                <div class="col-6">
                  <div>
                    {t('onlineOrder.settings.status')} </div>
                  <div style="font-style: italic">
                    <span>
                      {connected.value ? 'Connected' : 'Not connected'}
                    </span>
                    {
                      (connected.value) &&
                      <span style="color: #4CAF50">
                        ({webshopName.value || 'Demo'}) </span>
                    }
                  </div>
                </div>
                <div class="col-6">
                  <div>
                    {t('onlineOrder.settings.webshopUrl')} </div>
                  <div>
                    <span style="font-style: italic; color: #536DFE">
                      {computedDevice.value.url} </span>
                    {
                      (!webshopAvailable.value) &&
                      <span style="font-style: italic; color: #F44336">
                        - {t('onlineOrder.settings.notAvailable')}
                      </span>
                    }
                  </div>
                </div>
                <div class="col-6 mt-3">
                  <g-btn flat background-color="#1271ff" text-color="#fff" uppercase={false} onClick={() => dialog.value = true}>
                    Reset Online Orders
                  </g-btn>
                </div>
                <div class="col-6 mt-3">
                  <div class="row-flex">
                    {
                      (isMasterDevice.value) &&
                      <g-btn flat background-color="#1271ff" text-color="#fff" uppercase={false} disabled={disableDataBtn.value} onClick={uploadData}>
                        Upload demo data
                      </g-btn>
                    }
                    <g-switch class="ml-3" label="Template Data" v-model={isTemplateData.value}></g-switch>
                  </div>
                  <g-btn class="mt-2" flat background-color="#1271ff" text-color="#fff" uppercase={false} disabled={disableDataBtn.value} onClick={downloadData}>
                    Import demo data
                  </g-btn>
                </div>
              </div>
            }
            <g-divider style="margin-top: 20px"></g-divider>
          </div>
          <div class="online-order-setting__title">
            {t('onlineOrder.settings.generalSettings')} </div>
          <div class="online-order-setting__content">
            <div>
              <b> {t('onlineOrder.settings.timeToComplete')} </b>
            </div>
            <g-row>
              <g-grid-select grid={false} items={deliveryTimes} v-model={computedDefaultPrepareTime.value} mandatory v-slots={{
                'default': ({ toggleSelect, item }) =>
                    <g-btn-bs border-color="#e0e0e0" text-color="black" width="72" height="30" style="margin-top: 8px" onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                      {item}
                    </g-btn-bs>
                ,
                'selected': ({ toggleSelect, item }) =>
                    <g-btn-bs border-color="#90CAF9" text-color="black" width="72" height="30" background-color="#E3F2FD" style="margin-top: 8px" onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                      {item}
                    </g-btn-bs>
              }}></g-grid-select>
            </g-row>
            <div style="margin-top: 16px;">
              <b> {t('onlineOrder.settings.sound')} </b>
            </div>
            <g-switch label={t('onlineOrder.settings.hasSound')} modelValue={computedDevice.value.sound} onUpdate:modelValue={updateSound}></g-switch>
            <div style="margin-top: 16px;">
              <b> {t('onlineOrder.settings.playNotificationSound')} </b>
            </div>
            <g-grid-select grid={false} item-cols="4" items={soundModes} mandatory modelValue={computedDevice.value.soundLoop} onUpdate:modelValue={updateSoundMode} v-slots={{
              'default': ({ toggleSelect, item }) =>
                  <g-btn-bs border-color="#e0e0e0" text-color="black" height="30" style="margin-top: 8px; white-space: nowrap" onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                    {item.text}
                  </g-btn-bs>
              ,
              'selected': ({ item }) =>
                  <g-btn-bs border-color="#90CAF9" text-color="black" height="30" background-color="#E3F2FD" style="margin-top: 8px; white-space: nowrap">
                    {item.text}
                  </g-btn-bs>
            }}></g-grid-select>
            <div style="margin-top: 16px;">
              <b> {t('onlineOrder.settings.sorting')} </b>
            </div>
            <g-grid-select grid={false} items={orderSorting} v-model={computedOnlineOrderSorting.value} mandatory v-slots={{
              'default': ({ toggleSelect, item }) =>
                  <g-btn-bs border-color="#e0e0e0" text-color="black" width="160" height="30" style="margin-top: 8px" onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                    {item.text}
                  </g-btn-bs>
              ,
              'selected': ({ toggleSelect, item }) =>
                  <g-btn-bs border-color="#90CAF9" text-color="black" width="160" height="30" background-color="#E3F2FD" style="margin-top: 8px" onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                    {item.text}
                  </g-btn-bs>
            }}></g-grid-select>
          </div>
          <dialog-form-input v-model={dialog.value} onSubmit={checkClearOrderPasswd} v-slots={{
            'input': () =>
                <g-text-field-bs label="Enter your passcode" v-model={passcode.value} clearable></g-text-field-bs>
          }}></dialog-form-input>
        </div>
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
    /*width: 80%;*/
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
