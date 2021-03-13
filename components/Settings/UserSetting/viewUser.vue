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
  onSave, userList,
  init, viewOnlineOrderDashboard, viewOnlineOrderMenu, viewOrder, viewOrderHistory, viewReservation, canChangeTableWaiter, getUserList
} from './view-user-logics';
import { genScopeId } from '../../utils';
import { useI18n } from 'vue-i18n';
import dialogSelectAvatar from './dialogSelectAvatar'
import dialogUserDetail from './dialogUserDetail';
import { onActivated } from 'vue';
import { appType, currentAppType } from '../../AppType';

export default {
  components: { dialogSelectAvatar, dialogUserDetail },
  setup() {
    const { t } = useI18n()
    onActivated(async () => {
      if (filteredUserList.value.length === 0) userList.value = await getUserList()
      if (!selectedUser.value) selectedUser.value = (filteredUserList.value.length > 0 ? filteredUserList.value[0] : null)
    })

    const userListRender = genScopeId(() => <div class="user-list">
      {
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
      }
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

    const renderSwitch = (title, model) => (
        <div class="user-edit__item">
          <g-switch dense label={t(title)} v-model={model.value} onUpdate:modelValue={onSave}/>
        </div>
    )

    const editAreaRender = genScopeId(() => selectedUser.value &&
        <div class="user-edit">
          <div class="user-edit__title row-flex align-items-center pl-4 fw-700">
            {t('settings.editUser')}
          </div>

          <div class="user-edit__item">
            <g-text-field-bs label={t('settings.name')} v-model={selectedUser.value.name} onUpdate:modelValue={onSave} v-slots={{
              'append-inner': () =><g-icon style="cursor: pointer" onClick={onEditUsername}>icon-keyboard</g-icon>
            }}/>
          </div>

          { /*render user avatar*/
            (!selectedUserIsAdmin.value) &&
            <div class="user-edit__item">
              <p class="mb-2">{t('settings.userAvatar')}</p>
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

          {/* pass-code */}
          <div class="user-edit__item">
            <g-text-field-bs label={t('settings.passcode')} v-model={selectedUser.value.passcode} v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer" onClick={onEditPasscode}>icon-keyboard</g-icon>
            }}/>
          </div>

          {/*another settings*/
            (!selectedUserIsAdmin.value) && <>
              { appType.POS_RESTAURANT === currentAppType.value
                  ? <>
                      <div>{/*Blank to push next item to the next row*/}</div>
                      { renderSwitch('settings.viewOnlineOrderDashboard', viewOnlineOrderDashboard) }
                      { renderSwitch('settings.viewOrder', viewOrder) }
                      { renderSwitch('settings.viewOnlineOrderMenu', viewOnlineOrderMenu) }
                      { renderSwitch('settings.viewOrderHistory', viewOrderHistory) }
                      { renderSwitch('settings.viewReservation', viewReservation) }
                      { renderSwitch('settings.changeTableWaiter', canChangeTableWaiter) }
                    </>
                  : <>
                      <div>{/*Blank to push next item to the next row*/}</div>
                    </>
              }
            </>
          }
        </div>)

    // { renderSwitch('settings.viewOwnReport', viewOwnReport) }
    // { renderSwitch('settings.viewOtherReport', viewOrderReport) }
    // { renderSwitch('settings.editArticleTableLayout', editArticleTableLayout) }
    // { renderSwitch('settings.accessZReport', accessZReport) }
    // { renderSwitch('settings.itemCancellation', itemCancellation) }
    // { renderSwitch('settings.allowTableTakeOver', allowTableTakeOver) }
    // { renderSwitch('settings.allowItemCancellationAfterReactivePaidTable', allowItemCancellationAfterReactivePaidTable) }
    // { renderSwitch('settings.allowMoveItem', allowMoveItem) }
    // { renderSwitch('settings.reactivePaidTable', reactivePaidTable) }
    // { renderSwitch('settings.allowTableSwitch', allowTableSwitch) }
    // { renderSwitch('settings.openCashDrawerManually', openCashDrawerManually) }
    // { renderSwitch('settings.discount', discount) }
    // { renderSwitch('settings.cancelInvoice', cancelInvoice) }

    return genScopeId(() => <div class="user">
      {userListRender()}
      {editAreaRender()}
      <dialogSelectAvatar v-model={showDialogSelectAvatar.value}/>
      <dialogUserDetail v-models={[[focusInput.value, 'focusInput'], [showDialogUserDetail.value]]}/>
      <dialogUserDetail add v-models={[[focusInput.value, 'focusInput'], [showDialogNewUser.value]]}/>
    </div>)
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
    max-height: 100%;
    overflow: scroll;

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
