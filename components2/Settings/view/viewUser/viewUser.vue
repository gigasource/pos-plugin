<script>
import {
  showDialogNewUser,
  filteredUserList,
  focusInput,
  onAddUser,
  onEditPasscode,
  onEditUsername,
  selectedUser,
  selectedUserIsAdmin,
    showDialogUserDetail,
    showDialogSelectAvatar,
  onSave,
    init, viewOnlineOrderDashboard, viewOnlineOrderMenu, viewOrder, viewOrderHistory, viewReservation
} from './view-user-logics';
import { genScopeId } from '../../../utils';
import { useI18n } from 'vue-i18n';
import dialogSelectAvatar from './dialogSelectAvatar'
import dialogUserDetail from './dialogUserDetail';
export default {
  components: { dialogSelectAvatar, dialogUserDetail},
  setup() {
    const { t } = useI18n()
    init()
    // onActivated(async () => {
    //   if (filteredUserList.value.length === 0)
    //     await getListUsers()
    //   selectedUser.value.value = filteredUserList.value[0]
    // })

    const userListRender = genScopeId(() => <div class="user-list">
      <g-list items={filteredUserList.value}
              active-class="item__active"
              divider
              elevation="0"
              item-text="name"
              mandatory
              prepend-type="avatar"
              return-object
              selectable
              v-model={selectedUser.value}>
      </g-list>
      <div onClick={onAddUser} class="row-flex align-items-center pa-2 pl-3">
        <g-avatar size="40">
          <g-icon svg>
            icon-add_user
          </g-icon>
        </g-avatar>
        <p class="ml-3 text-red fs-small">
          {t('settings.addUser')} </p>
      </div>
    </div>)

    const editAreaRender = genScopeId(() => <div class="user">
      {selectedUser.value &&
      <div class="user-edit">
        <div class="user-edit__title row-flex align-items-center pl-4 fw-700">
          {t('settings.editUser')}
        </div>
        <div class="user-edit__item">
          <g-text-field-bs label={t('settings.name')} v-model={selectedUser.value.name} onUpdate:modelValue={onSave} v-slots={{
            'append-inner': () =>
                <g-icon style="cursor: pointer" onClick={onEditUsername}>
                  icon-keyboard
                </g-icon>
          }}>
          </g-text-field-bs>
        </div>
        {
          (!selectedUserIsAdmin.value) &&
          <div class="user-edit__item">
            <p class="mb-2">
              {t('settings.userAvatar')} </p>
            <div class="row-flex align-items-center" style="height: 40px">
              {
                (selectedUser.value && selectedUser.value.avatar) &&
                <g-avatar class="mr-2" size="40">
                  <img src={selectedUser.value.avatar} alt> </img>
                </g-avatar>
              }
              <a onClick={() => showDialogSelectAvatar.value = true} class="link-change"> {t('ui.change')} </a>
            </div>
          </div>
        }
        <div class="user-edit__item">
          <g-text-field-bs label={t('settings.passcode')} v-model={selectedUser.value.passcode} v-slots={{
            'append-inner': () =>
                <g-icon style="cursor: pointer" onClick={onEditPasscode}>
                  icon-keyboard
                </g-icon>
          }}></g-text-field-bs>
        </div>
        {
          (!selectedUserIsAdmin.value) && <>
            <div class="user-edit__item">
              <g-switch dense label={t('settings.viewOnlineOrderDashboard')} v-model={viewOnlineOrderDashboard.value} onUpdate:modelValue={onSave}/>
            </div>
            <div class="user-edit__item">
              <g-switch dense label={t('settings.viewOrder')} v-model={viewOrder.value} onUpdate:modelValue={onSave}/>
            </div>

            <div class="user-edit__item">
              <g-switch dense label={t('settings.viewOnlineOrderMenu')} v-model={viewOnlineOrderMenu.value} onUpdate:modelValue={onSave}/>
            </div>

            <div class="user-edit__item">
              <g-switch dense label={t('settings.viewOrderHistory')} v-model={viewOrderHistory.value} onUpdate:modelValue={onSave}/>
            </div>
            <div class="user-edit__item">
              <g-switch dense label={t('settings.viewReservation')} v-model={viewReservation.value} onUpdate:modelValue={onSave}/>
            </div>
          </>
        }
      </div>}
    </div>)
    return genScopeId(() => <>
      { userListRender()}
      { editAreaRender()}
      <dialogUserDetail v-models={[[focusInput.value, 'focusInput'], [showDialogUserDetail.value]]} />
      <dialogSelectAvatar v-model={showDialogSelectAvatar.value}/>
      <dialogUserDetail add v-models={[[focusInput.value, 'focusInput'], [showDialogNewUser.value]]}/>
    </>)
  }
}
</script>

<style lang="scss" scoped>
.user {
  display: flex;
  height: 100%;

  &-list {
    flex: 0 0 200px;
    overflow-y: auto;
    border-right: 1px solid rgba(0, 0, 0, 0.12);

    .g-list {
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      padding: 0;

      ::v-deep .g-list-item-text {
        font-size: 13px;
        line-height: 16px;
        color: #4D4D4E;
      }

      ::v-deep .g-image-content {
        background-size: contain !important;
      }

      ::v-deep .g-list-item__active:hover {
        background: rgba(242, 242, 242, 0.5);
      }

      ::v-deep .item__active {
        border-right: 5px solid #1271ff;
        background: rgba(242, 242, 242, 0.5);
        transition: none;

        &::before {
          background: rgba(242, 242, 242, 0.5);
        }

        .g-list-item-text {
          color: #1271ff;
        }
      }
    }
  }

  &-edit {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 56px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;

    &__title {
      grid-area: 1 / 1 / 2 / 3;
    }

    &__item {
      padding: 0 16px;
      font-size: 13px;
      line-height: 16px;

      &:nth-child(even) {
        border-right: 1px solid rgba(0, 0, 0, 0.12);
      }

      .link-change {
        font-weight: 700;
        font-size: 14px;
        line-height: 18px;
        color: #1471FF;
        cursor: pointer;
      }

      .bs-tf-wrapper {
        margin: 8px 5px 0;
      }
    }
  }
}

</style>
