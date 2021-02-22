<script>

import { GAvatar, GBtn, GImg, GSidebar, GSideBarTreeView, GSpacer } from '../../../../../backoffice/pos-vue-framework';
import { useI18n } from 'vue-i18n';
import { onBeforeMount, onBeforeUnmount, ref, withModifiers } from 'vue';
import { avatar, user, username } from '../../AppSharedStates';
import { login } from '../../Login/LoginLogic';
import { genScopeId, internalValueFactory } from '../../utils';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router'

export default {
  name: 'PosDashboardSidebar',
  components: [GImg, GAvatar, GSidebar, GSpacer, GSideBarTreeView, GBtn],
  props: {
    items: Array,
    modelValue: {
      type: String
    }
  },
  emit: ['toggle', 'update:modelValue'],
  setup(props, { slots, emit }) {
    const router = useRouter()
    const { t } = useI18n()
    const internalValue = internalValueFactory(props, { emit })
    let timerInterval
    const now = ref(dayjs().format('HH:mm'))

    function logout() {
      user.value = null
      router.push('/pos-login')
    }

    onBeforeMount(async function () {
      //todo: remove auto login
      if (!user.value) await login('0000')
      timerInterval = setInterval(() => now.value = dayjs().format('HH:mm'), 1000)
    })

    onBeforeUnmount(() => {
      if (timerInterval.value) clearInterval(timerInterval)
    })

    const footerDefaultRenderFn = () => <g-btn uppercase={false} large text
                                               background-color="white"
                                               text-color="#424242" width="100%"
                                               onClick={withModifiers(logout, ['stop'])}>
      <g-icon svg>icon-logout</g-icon>
      <span class="ml-2">{t('sidebar.logOut')}</span>
    </g-btn>

    const sidebarSlots = {
      header: genScopeId(() => <div class={['sidebar-header']}>
        <g-avatar size="40">
          <g-img src={avatar.value}></g-img>
        </g-avatar>
        <span class="username">{username.value}</span>
        <g-spacer/>
        <span>{now.value}</span>
      </div>),
      default: genScopeId(() => <>
        {slots['above-tree-view'] ? slots['above-tree-view']() : null}
        {
          //todo: should provide target for each item, instead of providing onClick handler
        }
        <g-side-bar-tree-view
            data={props.items}
            onNodeSelected={node => node.onClick && node.onClick()}
            onNodeExpansionToggled={() => emit('toggle')}
            v-model={internalValue.value}
        />
        <slot name="above-spacer"/>
        {slots['above-spacer'] && slots['above-spacer']()}
        <g-spacer/>
        {slots['below-spacer'] && slots['below-spacer']()}
        {slots['footer'] ? slots['footer']() : footerDefaultRenderFn()}
      </>)
    }
    return genScopeId(() => <g-sidebar medium style="height: 100vh; z-index: 2"
                                       v-slots={sidebarSlots}/>)
  }
}
</script>

<style scoped lang="scss">
.g-sidebar {

  .sidebar-header {
    padding: 12px;
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 18px;
    font-weight: 600;
    color: #1d1d26;

    .username {
      word-break: break-all;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      padding-left: 8px;
    }
  }
}

.g-treeview-wrapper ::v-deep .g-treeview-item.g-treeview__active {
  background: linear-gradient(9.78deg, #3949AB 0%, #4FC3F7 100%) !important;
  box-shadow: 0 1px 8px 1px rgba(28, 144, 196, 0.5);
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  margin-right: 8px;
}

.g-treeview-wrapper ::v-deep .g-treeview-item .g-treeview-title {
  line-height: 1.2;
  white-space: normal;
  display: -webkit-box;
  word-break: break-word;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.g-btn ::v-deep .g-btn__content {
  justify-content: flex-start;
  color: #424242;
  font-size: 14px;
}

.g-treeview-wrapper ::v-deep .g-badge-wrapper {
  margin-right: 16px !important;
}

@media screen and (max-width: 1023px) {
  .g-sidebar-wrapper ::v-deep .g-sidebar {
    width: 180px;
    max-width: 180px;

    .g-treeview-wrapper .g-treeview-title {
      font-size: 14px;
    }
  }
}
</style>

<style>
.g-sidebar {
  overflow: auto !important;
}
</style>
