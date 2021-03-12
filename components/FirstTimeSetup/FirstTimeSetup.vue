<script>
import { ref, withModifiers } from 'vue'
import { execGenScopeId, genScopeId } from '../utils';
import { useRouter } from 'vue-router'
import {
  demoMode,
  dialog,
  getServerUrl,
  items,
  onKeyEnterPressed,
  openDialogDemo,
  pairingTabRef,
  secretClick,
  selectDemoData,
  sendRequestTabRef,
  showCustomUrlDialog,
  showKeyboard,
  showLoadingOverlay,
  tab,
  updateServerUrl
} from './first-time-setup-shared';
import SendRequestTab from './SendRequestTab';
import PairingTab from './PairingTab';

export default {
  name: 'FirstTimeSetup2',
  components: { PairingTab, SendRequestTab },
  props: {},
  setup() {

    const router = useRouter()

    function start() {
      router.push('/pos-login')
    }

    const renderKeyboard = () => (showKeyboard.value) &&
        <div class="keyboard-wrapper">
          <pos-keyboard-full type="alpha-number" onEnterPressed={onKeyEnterPressed}/>
        </div>
    const place = ref('')
    const phone = ref('')
    return genScopeId(() => (
        <div class="background row-flex align-items-center justify-center">
          <div class={showKeyboard.value ? 'left' : 'center'}>
            <div class="dialog-title" onClick={withModifiers(secretClick, ['stop'])}>
              Welcome to Restaurant+ POS
            </div>
            <g-tabs v-model={tab.value} items={items.value}>
              {execGenScopeId(() =>
                  <>
                    <g-tab-item item={items.value[0]} style="height: 230px; padding-top: 4px">
                      {execGenScopeId(() =>
                          <SendRequestTab v-models={[[place.value, 'place'], [phone.value, 'phone']]} ref={sendRequestTabRef} onStart={start}/>)}
                    </g-tab-item>
                    <g-tab-item item={items.value[1]} style="height: 200px; padding-top: 4px">
                      {execGenScopeId(() => <PairingTab ref={pairingTabRef} onStart={start}/>)}
                    </g-tab-item>
                  </>
              )}
            </g-tabs>
          </div>
          <dialog-custom-url v-model={showCustomUrlDialog.value} onConfirm={updateServerUrl} onGetServerUrl={async cb => await getServerUrl(cb)}/>
          <g-btn style="position: absolute; top: 10px; right: 10px" onClick={openDialogDemo}>
            Skip to Demo
          </g-btn>
          {renderKeyboard()}
          <dialog-demo v-model={dialog.demo} mode={demoMode.value} address={place.value} phone={phone.value} onComplete={(store) => { selectDemoData(store, start)}}/>
          <g-dialog v-model={showLoadingOverlay.value} content-class="loading-overlay">
            <g-progress-circular color="#fff" indeterminate size="100" width="10"/>
          </g-dialog>
        </div>
    ))
  }
}
</script>
<style scoped lang="scss">
.background {
  height: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  background-image: url("/plugins/pos-plugin/assets/background-blur.png");


  .center, .left {
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 4px;
  }

  .center {
    padding: 0 24px;
    border-radius: 4px;
    width: 50%;
  }

  .left {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 40%;
  }

  .keyboard-wrapper {
    position: absolute;
    left: 40%;
    right: 0;
    bottom: 0;
    background-color: #f0f0f0;
    padding: 4px;

    ::v-deep .key {
      font-size: 18px !important;
      transition: none;

      &.key-enter {
        font-size: 14px !important;
      }
    }
  }
}

.dialog {
  width: 100%;
  background: white;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &-title {
    font-size: 20px;
    font-weight: 700;
    margin: 12px 0;

    &--sub {
      font-size: 15px;
      margin-top: 8px;
      margin-bottom: 12px;
    }
  }

  &-message {
    font-size: 15px;
    color: #424242;
    text-align: center;
    margin-bottom: 16px;
    margin-top: 4px;

    &--error {
      color: #f44336;
      font-style: italic;
    }

    &--note {
      text-align: left;
      font-size: 12px;
      font-style: italic;
      align-self: center;
      margin-left: 5px;
    }

    &--subtext {
      margin-left: 5px;
      font-size: 12px;
      margin-bottom: 8px;
      text-align: left;
      align-self: flex-start;
    }
  }

  .bs-tf-wrapper {
    margin: 8px 0;

    ::v-deep {
      .bs-tf-label {
        font-size: 15px;
      }

      .bs-tf-input {
        font-size: 34px;
        font-weight: 700;
        color: #000000;
        text-align: center;
        width: 100%;
      }
    }

    &.text-small ::v-deep .input {
      flex: 1;

      .bs-tf-input {
        font-size: 24px;
        padding: 13px 6px;
      }
    }
  }
}

.g-combobox ::v-deep {
  .bs-tf-label {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .bs-tf-input {
    font-size: 18px;
    padding: 12px 6px;
  }
}

.tf-phone {
  ::v-deep fieldset {
    background-color: #F0F0F0;
    border: 1px solid #ced4da;
  }

  &.g-tf__focused ::v-deep fieldset {
    border-color: #1271FF;
  }
}
</style>

<style lang="scss">
.menu-autocomplete-setup {
  .g-list {
    padding: 0;

    &-item {
      min-height: 0;
    }

    .g-list-item-content {
      padding-right: 4px;

      .g-list-item-text {
        white-space: normal;
        word-break: break-word;
        line-height: 1.4;
        padding: 2px 0;
      }
    }

    & > div:not(:last-child) .g-list-item-text {
      border-bottom: 1px solid #F0F0F0;
    }
  }
}
</style>
