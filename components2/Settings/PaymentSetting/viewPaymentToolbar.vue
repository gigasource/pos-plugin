<script>
import { updatePayment } from '../settings-shared-logics';
import { computed, ref, withModifiers, watch } from 'vue'
import { useI18n } from 'vue-i18n';
import { selectedPayment, onOpenDialogDelete, onOpenDialogEditPayment, onDeletePayment, dialogRef, showDialogConfirmDelete, onOpenDialogNewPayment} from './view-payment-logics';
import dialogNewPayment from './dialogNewPayment';
import dialogConfirmDelete from '../../pos-shared-components/dialogConfirmDelete';
export default {
  components: {dialogNewPayment, dialogConfirmDelete},
  setup() {
    const { t } = useI18n()
    return () => <>
      <g-btn uppercase={false} background-color="white" text-color="#1d1d26" class="mr-3" disabled={!selectedPayment.value || !selectedPayment.value.editable} onClick={onOpenDialogEditPayment}>
        <g-icon class="mr-2" color="red">
          edit
        </g-icon>
        {t('ui.edit')}
      </g-btn>
      <g-btn uppercase={false} background-color="white" class="mr-3" disabled={!selectedPayment.value} text-color="#1d1d26" onClick={onOpenDialogDelete}>
        <g-icon class="mr-2" svg>
          icon-trash
        </g-icon>
        {t('ui.delete')}
      </g-btn>
      <g-btn uppercase={false} background-color="#4CAF50" text-color="#FFFFFF" onClick={onOpenDialogNewPayment}>
        + {t('settings.createPayment')}
      </g-btn>
      <dialogConfirmDelete type="payment" label={selectedPayment.value ? selectedPayment.value.name : ''} v-model={showDialogConfirmDelete.value} onSubmit={onDeletePayment}></dialogConfirmDelete>
      <dialogNewPayment ref={dialogRef}></dialogNewPayment>
    </>
  }
}
</script>


<style scoped lang="scss">
@media screen and (max-width: 1023px) {
  .g-btn {
    ::v-deep .g-btn__content {
      font-size: 12px;
    }
  }
}
</style>
