<script>
import { withModifiers } from 'vue'
import { useI18n } from 'vue-i18n';
import { PaymentDialogLogicsFactory, selectedPayment } from './view-payment-logics';
import { execGenScopeId, genScopeId } from '../../utils';

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { isEditing, paymentName, showKeyboard, back, save, iconSrc, openPaymentDialog, internalValue } = PaymentDialogLogicsFactory(props, { emit })
    const renderFn = genScopeId(() =>
        <g-dialog v-model={internalValue.value} fullscreen eager>
          {execGenScopeId(() =>
              <div class="dialog-payment w-100">
                <div class="form" onClick={() => showKeyboard.value = false}>
                  <p class="ml-1 mb-3">
                    {isEditing.value && selectedPayment.value
                        ? t('settings.editPayment')
                        : t('settings.createPayment')}
                  </p>
                  <g-text-field-bs class="bs-tf__pos"
                                   style="width: 268px"
                                   label={t('settings.paymentName')}
                                   placeholder={t('settings.paymentNameExample')}
                                   onClick={withModifiers(() => showKeyboard.value = !showKeyboard.value, ['stop'])}
                                   v-model={paymentName.value}
                  />
                  <pos-file-input-image label="Icon" v-model={iconSrc.value}/>
                </div>
                {
                  (showKeyboard.value) &&
                  <div class="keyboard-wrapper">
                    <pos-keyboard-full v-model={paymentName.value}/>
                  </div>
                }
                <g-toolbar bottom color="grey lighten 3">
                  <g-btn uppercase={false} background-color="white" text-color="#1d1d26" class="ma-3" onClick={back}>
                    <g-icon class="mr-2" svg>
                      icon-back
                    </g-icon>
                    {t('ui.back')}
                  </g-btn>
                  <g-spacer/>
                  <g-btn uppercase={false} background-color="blue accent 3" text-color="white" class="ma-2" onClick={save}>
                    {t('ui.save')}
                  </g-btn>
                </g-toolbar>
              </div>)}
        </g-dialog>)
    return {
      renderFn, openPaymentDialog
    }
  },
  render() {
    return this.renderFn()
  }
}
</script>

<style scoped lang="scss">
.dialog-payment {
  background-color: white;
  display: flex;
  flex-direction: column;
  height: calc(100% - 64px);
  overflow: auto;

  .form {
    padding: 32px 32px 0;
    color: #1d1d26;
    font-weight: 700;

    .g-switch-wrapper {
      margin-top: 24px;

      ::v-deep .g-switch-label {
        font-size: 13px;
        line-height: 16px;
        font-weight: 400;
      }
    }

  }

  ::v-deep .keyboard-wrapper {
    position: absolute;
    bottom: 64px;
    min-height: 30%;
    width: 100%;
    padding: 16px;
    background-color: #BDBDBD;
  }
}

</style>
