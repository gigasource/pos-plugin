<script>
import { useI18n } from 'vue-i18n';
import { onActivated, onBeforeMount, withModifiers } from 'vue'
import { genScopeId } from '../../utils';
import {
  checkClearOrderPasswd,
  connected,
  defaultPrepareTime,
  deliveryTimes,
  dialog,
  disableDataBtn,
  downloadData,
  getWebshopUrl,
  isMasterDevice,
  isTemplateData,
  onlineDevice,
  OnlineOrderSettingLogicsFactory,
  onlineOrderSorting,
  passcode,
  snackbarRef,
  updateSound,
  updateSoundMode,
  uploadData,
  webshopAvailable,
  webshopName
} from './online-order-setting-logics'
import { appHooks } from '../../AppSharedStates';
import Snackbar from '../../../components/Store/Snackbar';

export default {
  components: { Snackbar },
  setup(props, { emit }) {
    appHooks.emit('settingChange')
    const { t } = useI18n()
    const { soundModes, orderSorting } = OnlineOrderSettingLogicsFactory()
    onBeforeMount(async () => {
      await getWebshopUrl()
    })
    onActivated(() => {
      appHooks.emit('settingChange')
      // emit('getOnlineDevice')
    })

    function renderDefaultTimeToCompleteOrderSetting() {
      return (
          <>
            <div>
              <b> {t('onlineOrder.settings.timeToComplete')} </b>
            </div>
            <g-row>
              <g-grid-select
                  grid={false}
                  mandatory
                  items={deliveryTimes}
                  v-model={defaultPrepareTime.value}
                  v-slots={{
                    default: ({ toggleSelect, item }) =>
                        <g-btn-bs border-color="#e0e0e0" text-color="black" width="72" height="30" style="margin-top: 8px"
                                  onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                          {item}
                        </g-btn-bs>,
                    selected: ({ toggleSelect, item }) =>
                        <g-btn-bs border-color="#90CAF9" text-color="black" width="72" height="30" background-color="#E3F2FD" style="margin-top: 8px"
                                  onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                          {item}
                        </g-btn-bs>
                  }}/>
            </g-row>
          </>
      )
    }
    function renderNotificationSoundSetting() {
      return (
          <>
            <div style="margin-top: 16px;">
              <b> {t('onlineOrder.settings.sound')} </b>
            </div>
            <g-switch
                label={t('onlineOrder.settings.hasSound')}
                modelValue={onlineDevice.value.sound}
                onUpdate:modelValue={updateSound}/>
            <div style="margin-top: 16px;">
              <b> {t('onlineOrder.settings.playNotificationSound')} </b>
            </div>
            <g-grid-select
                grid={false}
                item-cols="4"
                items={soundModes}
                mandatory
                modelValue={onlineDevice.value.soundLoop}
                onUpdate:modelValue={updateSoundMode}
                v-slots={{
                  default: ({ toggleSelect, item }) =>
                      <g-btn-bs border-color="#e0e0e0" text-color="black" height="30" style="margin-top: 8px; white-space: nowrap" onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                        {item.text}
                      </g-btn-bs>,
                  selected: ({ item }) =>
                      <g-btn-bs border-color="#90CAF9" text-color="black" height="30" background-color="#E3F2FD" style="margin-top: 8px; white-space: nowrap">
                        {item.text}
                      </g-btn-bs>
                }}/>
          </>
      )
    }
    function renderOrderSorting() {
      return (
          <>
            <div style="margin-top: 16px;">
              <b> {t('onlineOrder.settings.sorting')} </b>
            </div>
            <g-grid-select grid={false} items={orderSorting} v-model={onlineOrderSorting.value} mandatory v-slots={{
              default: ({ toggleSelect, item }) =>
                  <g-btn-bs border-color="#e0e0e0" text-color="black" width="160" height="30" style="margin-top: 8px"
                            onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                    {item.text}
                  </g-btn-bs>
              ,
              selected: ({ toggleSelect, item }) =>
                  <g-btn-bs border-color="#90CAF9" text-color="black" width="160" height="30" background-color="#E3F2FD" style="margin-top: 8px"
                            onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
                    {item.text}
                  </g-btn-bs>
            }}/>
          </>
      )
    }
    function renderGeneralSetting() {
      return (
          <div>
            <div class="online-order-setting__title">
              {t('onlineOrder.settings.generalSettings')}
            </div>
            <div class="online-order-setting__content">
              {renderDefaultTimeToCompleteOrderSetting()}
              {renderNotificationSoundSetting()}
              {renderOrderSorting()}
            </div>
          </div>
      )
    }

    function renderResetOnlineOrder() {
      return <>
        <g-btn class="mt-3" flat background-color="#1271ff" text-color="#fff" uppercase={false} onClick={() => dialog.value = true}>
          Reset Online Orders
        </g-btn>
        <dialog-form-input v-model={dialog.value} onSubmit={checkClearOrderPasswd} v-slots={{
          input: () => <g-text-field-bs label="Enter your passcode" v-model={passcode.value} clearable/>
        }}/>
      </>
    }

    return genScopeId(() =>
        <div class="online-order-setting">
          <div class="online-order-setting__title">
            {t('onlineOrder.settings.onlineOrderSettings')}
          </div>

          <div class="online-order-setting__content">
            {
              (onlineDevice.value) &&
              <div class="row-flex" style="flex-wrap: wrap">
                <div class="col-6">
                  <div>{t('onlineOrder.settings.status')}</div>
                  <div style="font-style: italic">
                    <span>{connected.value ? 'Connected' : 'Not connected'} </span>
                    {(connected.value) && <span style="color: #4CAF50">({webshopName.value || 'Demo'})</span>}
                  </div>
                  {renderResetOnlineOrder()}
                </div>
                <div class="col-6">
                  <div>{t('onlineOrder.settings.webshopUrl')}</div>
                  <div>
                    <span style="font-style: italic; color: #536DFE">{onlineDevice.value.url} </span>
                    {
                      (!webshopAvailable.value) && <span style="font-style: italic; color: #F44336">
                        - {t('onlineOrder.settings.notAvailable')}
                      </span>
                    }
                  </div>
                  <div class="row-flex mt-3">
                    {
                      (isMasterDevice.value) && <g-btn
                          flat background-color="#1271ff" text-color="#fff" uppercase={false}
                          disabled={disableDataBtn.value} onClick={uploadData}>
                        Upload demo data
                      </g-btn>
                    }
                    <g-switch style="margin: 0 !important;" class="ml-3" label="Template Data" v-model={isTemplateData.value}></g-switch>
                  </div>
                  <g-btn
                      class="mt-2" flat background-color="#1271ff" text-color="#fff" uppercase={false}
                      disabled={disableDataBtn.value} onClick={downloadData}>
                    Import demo data
                  </g-btn>
                </div>
              </div>
            }
            <g-divider style="margin-top: 20px"/>
          </div>
          {renderGeneralSetting()}
          <Snackbar ref={snackbarRef}></Snackbar>
        </div>)
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
