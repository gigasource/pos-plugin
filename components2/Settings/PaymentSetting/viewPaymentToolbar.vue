<script>
import {useI18n} from 'vue-i18n';
import {
  dialogRef,
  onDeletePayment,
  onOpenDialogDelete,
  onOpenDialogEditPayment,
  onOpenDialogNewPayment,
  selectedPayment,
  showDialogConfirmDelete
} from './view-payment-logics';
import dialogNewPayment from './dialogNewPayment';
import DialogConfirmDelete from "../../Dialog/DialogConfirmDelete";

export default {
  components: {dialogNewPayment, DialogConfirmDelete},
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
