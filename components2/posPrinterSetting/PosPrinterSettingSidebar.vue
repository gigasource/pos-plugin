<script>
import { onCreateNewPrinterGroup, SidebarFactory } from './pos-print-logics';
import { avatar, user, username } from '../AppSharedStates';
import { onBeforeMount, onBeforeUnmount, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n';
import { genScopeId } from '../utils'
import { useRouter } from 'vue-router'
import { login } from '../Login/LoginLogic';
import dayjs from 'dayjs';

export default {
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const { sidebarData, onSelect, isSelecting, selectingItem, onDeleteMenu } = SidebarFactory()
    const now = ref('')
    let timerInterval
    onBeforeMount(async function () {
      timerInterval = setInterval(() => now.value = dayjs().format('HH:mm'), 1000)
    })

    onBeforeUnmount(() => {
      if (timerInterval) clearInterval(timerInterval)
    })

    // todo: sidebar header: duplicate code

    function back() {
      router.go(-1)
    }

    const showDeleteDialog = ref(false)

    return genScopeId(() =>
        <g-sidebar v-slots={{
          'default': genScopeId(() =>
              <div class="sidebar-content-wrapper">
                <div class="sidebar-content">
                  {sidebarData.value.map((item, i) =>
                      <div class={['sidebar-row', item.value.displayChild && 'sidebar-row--open']} key={i}>
                        <div class={['sidebar-row__content', isSelecting(item.value) && 'sidebar-row--selected', item.value.displayChild && 'sidebar-row--open']} onClick={() => onSelect(item.value)}>
                          <g-icon size="20" class="sidebar-row__icon">
                            {item.value.icon}
                          </g-icon>
                          <p class="sidebar-row__title"> {item.value.title} </p>
                          {
                            (item.value.items) &&
                            <g-icon class={['sidebar-row__arrow', item.value.displayChild && 'sidebar-row__arrow--open']}>
                              expand_less
                            </g-icon>
                          }
                        </div>
                        {(item.value.items && item.value.displayChild) &&
                        <div class="sidebar-row__children">
                          {item.value.items.map((child, i) =>
                              (child.type && child.type === 'edit') ?
                                  <div class="row-flex">
                                    <div class="sidebar-row__children--edit add" onClick={() => onCreateNewPrinterGroup('kitchen')}>
                                      + {t('ui.add')}
                                    </div>
                                    <div class={['sidebar-row__children--edit', 'delete', (!selectingItem.value || selectingItem.value.groupKey !== child.groupKey) && 'disabled']} onClick={() => showDeleteDialog.value = true}>
                                      {t('ui.delete')}
                                    </div>
                                  </div>
                                  :
                                  <div class={['sidebar-row__children--content', isSelecting(child) && 'sidebar-row--selected']} key={i} onClick={withModifiers(() => onSelect(child), ['stop'])}>
                                    {
                                      (child.icon) &&
                                      <g-icon class="sidebar-row__icon sidebar-row__icon--small">
                                        {child.icon}
                                      </g-icon>
                                    }
                                    <p class="sidebar-row__title">
                                      {child.title}
                                    </p>
                                  </div>
                          )}
                        </div>
                        }
                      </div>
                  )} </div>
                <div class="sidebar-footer">
                  <g-btn-bs elevation="2" icon="icon-back" background-color="white" style="display: block" onClick={back}>
                    {t('ui.back')}
                  </g-btn-bs>
                </div>
                <dialog-confirm-delete v-model={showDeleteDialog.value} type="" onSubmit={onDeleteMenu}></dialog-confirm-delete>
              </div>)
          ,
          'header': genScopeId(() =>
              <div class="row-flex align-items-center py-2 px-3">
                <g-avatar size="40">
                  <img alt src={avatar.value}> </img>
                </g-avatar>
                <p class="username"> {username.value} </p>
                <p class="time">
                  {now.value} </p>
              </div>)
        }}>
        </g-sidebar>)
  }
}
</script>


<style scoped lang="scss">
.g-sidebar-wrapper {
  -webkit-tap-highlight-color: transparent;

  ::v-deep .g-sidebar-header {
    .username {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      margin-left: 12px;
    }

    .time {
      font-weight: 600;
    }
  }

  ::v-deep .g-sidebar {
    position: relative;
  }

  .sidebar-content-wrapper {
    flex: 1;
    overflow: hidden;

    .sidebar-content {
      margin-top: 8px;
      height: calc(100% - 64px);
      overflow: auto;

      .sidebar-row {
        color: #424242;
        cursor: pointer;

        &__content {
          display: flex;
          align-items: center;
        }

        &__icon {
          margin: 16px;
        }

        &__title {
          word-break: break-all;
          -webkit-line-clamp: 1;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 14px;
          font-weight: 700;
          flex: 1;
        }

        &__arrow {
          transition: transform 0.3s;

          &--open {
            transform: rotate(180deg);
          }
        }

        &__children {
          &--content {
            display: flex;
            align-items: center;

            .g-icon.sidebar-row__icon--small {
              font-size: 12px !important;
              margin-right: 20px;
              margin-left: 20px;
            }

            .sidebar-row__title {
              font-weight: 600;
            }
          }

          &--edit {
            padding: 8px 16px;
            margin: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 14px;
            flex: 1;

            &.add {
              color: #2979FF;
              border: 1px dashed #2196F3;
              background: #E3F2FD;
            }

            &.delete {
              color: #ff4552;
              border: 1px dashed #f32040;
              background: #fcd4dd;

              &.disabled {
                color: #616161;
                border-color: #bdbdbd;
                background: #f0f0f0;
                pointer-events: none;
              }
            }
          }
        }

        &--selected {
          background: linear-gradient(9.91deg, #3949AB 0%, #4FC3F7 100%) !important;
          box-shadow: 0 4px 13px rgba(94, 129, 244, 0.75);
          border-radius: 0 4px 4px 0;
          color: white;
          margin-right: 8px;
        }

        &--open {
          background-color: #f7f7f7;

          &.sidebar-row__content {
            background-color: #ededed;
          }
        }

        &__arrow {
          margin-left: auto;
          margin-right: 13px;

          &--collapse {
            transition: transform 0.3s;
          }

          &--expand {
            transform: rotate(-180deg);
          }
        }
      }
    }

    .sidebar-footer {
      z-index: 202;
      background: white;
      color: #1d1d26;
      padding: 12px;
    }
  }

}
</style>
