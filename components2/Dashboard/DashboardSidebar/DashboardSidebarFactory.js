import Hooks from 'schemahandler/hooks/hooks'
import {
  withScopeId,
  ref,
  onMounted,
  computed,
  watch,
  Fragment,
  onUnmounted,
  onBeforeUnmount,
  getCurrentInstance
} from 'vue'
import _ from 'lodash'

import { user } from '../../AppSharedStates'
import { login } from '../../Login/LoginLogic'
import { GAvatar, GImg, GSidebar, GSpacer, GSideBarTreeView, GBtn } from '../../../../../backoffice/pos-vue-framework';
import { useI18n } from 'vue-i18n'
import { DashboardSidebarItemsFactory } from './DashboardSidebarItems'
import { getScopeAttrs, getScopeId } from '../../../utils/helpers';

const DashboardSidebarFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'PosDashboardSidebar',
    components: [GImg, GAvatar, GSidebar, GSpacer, GSideBarTreeView, GBtn],
    setup() {
      const { t: $t } = useI18n()

      const { refactoredDashboardSidebarItems } = DashboardSidebarItemsFactory($t)
      let timerInterval = ref(null)
      const now = ref(dayjs().format('HH:mm'))
      onMounted(async function() {
        if (!user.value) await login('0000')
        timerInterval.value = setInterval(() => now.value = dayjs().format('HH:mm'), 1000)
        console.log(refactoredDashboardSidebarItems.value)
      })

      onBeforeUnmount(() => {
        if (timerInterval.value) timerInterval.value.clear()
      })
      const imgSrc = computed(() => {
        return user.value ? user.value.avatar : ''
      })
      const userName = computed(() => {
        return user.value ? user.value.name : ''
      })

      const sidebar = ref('')

      const mapTitle = (items) => {
        // return items.map(item => {
        //   if (typeof item.title === 'function') {
        //     return Object.assign({}, item, {
        //       title: item.title(),
        //       ...item.items && {items: this.mapTitle(item.items) }
        //     })
        //   }
        //   return item
        // })
        // return items.map(item => ({
        //   title: item.title,
        //   icon: item.icon,
        //   items: item.items,
        //   onClick: i
        // }))
        return items
      }

      const onNodeSelected = (node) => {
        node.onClick()
      }

      const sidebarSlots = {
        header: () => <div class={['sidebar-header']} {...getScopeAttrs() }>
          <g-avatar size="40">
            <g-img src={imgSrc.value}></g-img>
          </g-avatar>
          <span class="username">{userName.value}</span>
          <g-spacer/>
          <span>{now.value}</span>
        </div>,
        default: () => <g-side-bar-tree-view
          {...getScopeAttrs()}
          data = { mapTitle(refactoredDashboardSidebarItems.value)}
          onNodeSelected = { onNodeSelected }
        >
        </g-side-bar-tree-view>
      }
      const renderFn = () => <g-sidebar medium style="height: 100vh; z-index: 2" v-slots={sidebarSlots} {...getScopeAttrs()}>
      </g-sidebar>
      return renderFn
    }
  })

  return { hooks, fn }
}

export default DashboardSidebarFactory
