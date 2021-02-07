<script>

import { isCurrentUser, onOpenDialogDelete, onDeleteUser, showDialogConfirmDelete, selectedUser} from './view-user-logics';
import { useI18n } from 'vue-i18n';

export default {

  setup() {
    const { t } = useI18n()
    return () => <>
      <g-btn uppercase={false} background-color="white" disabled={isCurrentUser.value || !selectedUser.value} text-color="#1d1d26" onClick={onOpenDialogDelete}>
        <g-icon class="mr-2" svg>
          icon-trash
        </g-icon>
        {t('ui.delete')}
      </g-btn>
      <dialog-confirm-delete type=" user " label={selectedUser.value ? selectedUser.value.name : ''} v-model={showDialogConfirmDelete.value} onSubmit={onDeleteUser}/>
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
