<script>
import { isMobile } from '../../AppSharedStates';
import { useI18n } from 'vue-i18n';
import { TaxCategoryDialogLogicsFactory } from './view-tax-logics';
import { genScopeId } from '../../utils';

export default {
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { internalValue, submit, open, isValid, rules, taxType, taxName, taxValue } = TaxCategoryDialogLogicsFactory(props, { emit })


    const formRender = () => <div class="form">
      <div class="input">
        <g-text-field-bs class="bs-tf__pos" label="Name" v-model={taxName.value} suffix="%"/>
        <g-text-field-bs class="bs-tf__pos"
                         label={t('common.tax')}
                         v-model={taxValue.value} rules={[rules.value.number, rules.value.range]}
                         suffix="%"/>
        <g-text-field-bs class="bs-tf__pos" label="Type" v-model={taxType.value}/>
      </div>
      {
        (!isMobile.value) &&
        <div class="action">
          <g-btn uppercase={false} outlined class="mr-3" width="120" onClick={() => internalValue.value = false}>
            {t('ui.cancel')} </g-btn>
          <g-btn uppercase={false} flat background-color="blue accent 3" text-color="white" width="120" onClick={submit}
                 disabled={!isValid.value}>
            {t('ui.ok')} </g-btn>
        </div>
      }
    </div>
    const renderFn = () =>
        <g-dialog v-model={internalValue.value} overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager
                  fullscreen={isMobile.value}>
          {genScopeId(() => <>
            <div class="dialog-new-tax w-100">
              <g-icon onClick={() => internalValue.value = false} svg size="20" class="icon">
                icon-close
              </g-icon>
              {formRender()}
              <div class="bg-grey-lighten-1 pa-2">
                <pos-keyboard-full onEnterPressed={submit}/>
              </div>
            </div>
          </>)()}
        </g-dialog>
    return {
      renderFn,
      open
    }
  },
  render() {
    return this.renderFn()
  }
}
</script>

<style scoped lang="scss">
.dialog-new-tax {
  background-color: white;
  position: relative;
  display: flex;
  flex-direction: column;

  .form {
    margin-top: 16px;
    padding: 16px;
    flex: 1;

    .input {
      display: flex;
    }

    .action {
      display: flex;
      justify-content: flex-end;
      padding-top: 24px;
    }
  }

  .icon {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}
</style>
