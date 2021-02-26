<script>
import { useI18n } from 'vue-i18n'
import { dialog, selectedCustomer } from '../customer-logic-shared'
import { genScopeId, execGenScopeId } from '../../utils';

export default {
  name: 'dialogConfirmDelete',
  props: {
    modelValue: Boolean,
    type: String,
    label: [String, Number],
  },
  setup(props, { emit }) {

    const { t } = useI18n()

    const cancelDialog = () => {
      dialog.value.delete = false
    }

    const deleteCustomer = async () => {
      if (!selectedCustomer.value) return
      await deleteCustomer(selectedCustomer.value._id)
    }

    return genScopeId(() => (
        <g-dialog v-model={dialog.value.delete}
                  overlay-color="#6b6f82" overlay-opacity="0.95" width="40%" eager>
          {execGenScopeId(() => (
              <g-card class="w-100">
                { execGenScopeId(() => <>
                  <g-card-title>{t('ui.confirmation')}</g-card-title>
                  <g-card-text>
                    <span>{t('settings.deletePrompt')}</span>
                    <span>{t('settings.customer')}</span>
                    <b>"{selectedCustomer.value}"</b>?
                  </g-card-text>
                  <g-card-actions>
                    {
                      execGenScopeId(() => <>
                        <g-btn-bs border-color="#1d1d26" onClick={cancelDialog}>{t('ui.cancel')}</g-btn-bs>
                        <g-btn-bs background-color="red lighten 2" text-color="white" onClick={deleteCustomer}>{t('ui.delete')}</g-btn-bs>
                      </>)
                    }
                  </g-card-actions>
                </>) }
              </g-card>
          ))}
        </g-dialog>
    ))
  }
}
</script>

<style scoped lang="scss">
.g-card {
  .g-card-title,
  .g-card-text {
    justify-content: center;
    text-align: center;
    color: #1d1d26;
  }

  .g-card-text {
    padding: 32px 64px;
  }

  .g-card-actions {
    justify-content: flex-end;

    .g-btn {
      min-width: 120px !important;
    }

    .g-btn__outlined {
      border: 1px solid #979797;
      color: #1d1d26;
    }
  }
}
</style>
