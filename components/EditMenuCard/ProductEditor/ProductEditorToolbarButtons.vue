<script>
import constants from '../EditMenuCardToolbar/constants';
import { getCurrentInstance, ref } from 'vue';
import { useI18n } from 'vue-i18n'
import { genScopeId } from '../../utils';
import { ProductEditModes, updateProductEditMode, view } from '../../OrderView/pos-ui-shared';
import { canCopy, canDelete, canSwitch, deleteProductLayout, setAction } from './ProductEditorLogic';

const shouldShowSwitchEditModeDialog = ref(true)
const showSwitchEditModeDialog = ref(false)
const openSwitchModeDialogIfNeeded = () => {
  if (shouldShowSwitchEditModeDialog.value) {
    showSwitchEditModeDialog.value = true
    shouldShowSwitchEditModeDialog.value = false
  }
}

export default {
  name: 'ProductEditorToolbarButtons',
  props: {},
  setup() {
    const { t } = useI18n()
    const changeToIngredientMode = () => {
      openSwitchModeDialogIfNeeded()
      updateProductEditMode(ProductEditModes.ingredient)
    }

    // change position btn
    const renderSwitchBtn = () =>
        <g-btn-bs elevation="2" icon="icon-edit-menu-card-switch"
                  onClick={() => setAction('switch')}
                  disabled={!canSwitch.value}>{t('ui.switch')}</g-btn-bs>

    // clone button
    const renderCopyBtn = () =>
        <g-btn-bs elevation="2" icon="icon-edit-menu-card-copy"
                  onClick={() => setAction('copy')}
                  disabled={!canCopy.value}>{t('ui.copy')}</g-btn-bs>

    // delete button
    const showDeleteConfirmDialog = ref(false)
    const renderDeleteBtn = () => <>
      <g-btn-bs elevation="2" icon="icon-edit-menu-card-delete" onClick={() => showDeleteConfirmDialog.value = true} disabled={!canDelete.value}>{t('ui.delete')}</g-btn-bs>
      <dialog-confirm-delete v-model={showDeleteConfirmDialog.value} type=' this product' onSubmit={() => {
        deleteProductLayout();
        showDeleteConfirmDialog.value = false;
      }}></dialog-confirm-delete>
    </>

    // switch edit mode button
    const renderSwitchEditModeBtn = () => (view.value.mode === ProductEditModes.ingredient
            ? <g-btn-bs elevation="2" icon="icon-ingredient-mode"
                        onClick={() => updateProductEditMode(ProductEditModes.basic)}>{t('inventory.ingredientMode')} </g-btn-bs>
            : <g-btn-bs elevation="2" icon="icon-basic-mode"
                        onClick={changeToIngredientMode}>{t('inventory.basicMode')} </g-btn-bs>
    )
    const renderSwitchEditModeDialog = () => (
        <g-dialog v-model={showSwitchEditModeDialog.value} eager width="448">
          {genScopeId(() => (
              <div class="dialog" onClick={() => showSwitchEditModeDialog.value = false}>
                <div class="dialog-content">
                  <g-icon>icon-basic-mode</g-icon>
                  <div style="flex: 1; margin-left: 16px">
                    <p class="dialog-content__title">{t('inventory.basicMode')}</p>
                    <p class="dialog-content__detail">{t('inventory.basicNote')}</p>
                  </div>
                </div>
                <div class="dialog-content">
                  <g-icon>icon-ingredient-mode</g-icon>
                  <div style="flex: 1; margin-left: 16px">
                    <p class="dialog-content__title">{t('inventory.ingredientMode')}</p>
                    <p class="dialog-content__detail">{t('inventory.ingredientNote')}</p>
                  </div>
                </div>
                <div class="dialog-message">{t('inventory.clickDismiss')}</div>
              </div>
          ))()}
        </g-dialog>
    )

    return () => <>
        <portal to={constants.portalLeftButtons}>
          {
            genScopeId(() => [
              renderSwitchBtn(),
              renderDeleteBtn(),
              renderCopyBtn()
            ])()
          }
        </portal>
        <portal to={constants.portalRightButtons}>
          {
            genScopeId(() => [
              renderSwitchEditModeBtn(),
              renderSwitchEditModeDialog()
            ])()
          }
        </portal>
    </>
  }
}
</script>
<style scoped lang="scss">
@import "../EditMenuCardToolbar/emc-button.scss";

.dialog {
  width: 100%;
  background-color: white;
  border-radius: 4px;
  padding: 20px;

  &-content {
    display: flex;
    margin-bottom: 16px;

    &__title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    &__detail {
      font-size: 13px;
    }
  }

  &-message {
    text-align: center;
    font-size: 12px;
    color: #9e9e9e;
  }
}

</style>
