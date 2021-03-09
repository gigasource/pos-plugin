<script>
import { useI18n } from 'vue-i18n';
import {
  dialogRef,
  onDeleteTaxCategory,
  onOpenDialogDelete,
  onOpenDialogEditTaxCategory,
  onOpenTaxCategoryDialog,
  selectedTaxCategory,
  showDialogConfirmDelete
} from './view-tax-logics';
import { genScopeId } from '../../utils';
import dialogNewTaxCategory from './dialogNewTaxCategory';

export default {
  components: { dialogNewTaxCategory },
  setup() {
    const { t } = useI18n()
    return genScopeId(() => <>
      <g-btn uppercase={false} background-color="white" text-color="#1d1d26" class="mr-3" disabled={!selectedTaxCategory.value} onClick={onOpenDialogEditTaxCategory}>
        <g-icon class="mr-2" color="red">
          edit
        </g-icon>
        {t('ui.edit')}
      </g-btn>
      <g-btn uppercase={false} class="mr-3" background-color="white" disabled={!selectedTaxCategory.value} text-color="#1d1d26" onClick={onOpenDialogDelete}>
        <g-icon class="mr-2" svg>
          icon-trash
        </g-icon>
        {t('ui.delete')}
      </g-btn>
      <g-btn uppercase={false} background-color="#4CAF50" text-color="#FFFFFF" onClick={onOpenTaxCategoryDialog}>
        + {t('settings.createTax')}
      </g-btn>
      <dialog-confirm-delete type=" tax category " label={selectedTaxCategory.value ? selectedTaxCategory.value.name : ''} v-model={showDialogConfirmDelete.value} onSubmit={onDeleteTaxCategory}/>
      <dialogNewTaxCategory ref={dialogRef}/>
    </>)
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
