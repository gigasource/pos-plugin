import Hooks from 'schemahandler/hooks/hooks'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { user } from '../../AppSharedStates'
import { login } from '../../Login/LoginLogic'
import { GAvatar, GBtn, GImg, GSidebar, GSideBarTreeView, GSpacer } from '../../../../../backoffice/pos-vue-framework';
import { useI18n } from 'vue-i18n'
import DashboardSidebarItemsFactory from './DashboardSidebarItems'
import { getScopeAttrs } from '../../../utils/helpers';

const DashboardSidebarFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'PosDashboardSidebar',
    components: [GImg, GAvatar, GSidebar, GSpacer, GSideBarTreeView, GBtn],
    props: {
      items: Array
    },
    emit: ['toggle'],
    setup(props, { slots, emit }) {

      const { t: $t } = useI18n()

      const { refactoredDashboardSidebarItems } = DashboardSidebarItemsFactory($t)
      let timerInterval = ref(null)
      const now = ref(dayjs().format('HH:mm'))
      onMounted(async function () {
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

      const footerDefaultRenderFn = () =>  <g-btn uppercase={false} large text background-color="white" text-color="#424242" width="100%" onClick={(e) => {
        e.stopPropagation();
        logout()
        }}>
        <g-icon svg>icon-logout</g-icon>
        <span className="ml-2">{$t('sidebar.logOut')}</span>
      </g-btn>
      const sidebarSlots = {
        header: () => <div class={['sidebar-header']} {...getScopeAttrs()}>
          <g-avatar size="40">
            <g-img src={imgSrc.value}></g-img>
          </g-avatar>
          <span class="username">{userName.value}</span>
          <g-spacer/>
          <span>{now.value}</span>
        </div>,
        default: () => <>
          { slots['above-tree-view'] ? slots['above-tree-view']() : null}
          <g-side-bar-tree-view
            {...getScopeAttrs()}
            data={props.items}
            onNodeSelected={onNodeSelected}
            onNodeExpansionToggled={() => emit('toggle')}
          >
          </g-side-bar-tree-view>
          <slot name="above-spacer"/>
          { slots['above-spacer'] ? slots['above-spacer']() : null}
          <g-spacer></g-spacer>
          { slots['below-spacer'] ? slots['below-spacer']() : null}
          { slots['footer'] ? slots['footer']() : footerDefaultRenderFn() }
        </>
      }
      return () => <g-sidebar medium style="height: 100vh; z-index: 2"
                              v-slots={sidebarSlots}
                              {...getScopeAttrs()}>
      </g-sidebar>
    }
  })

  return { hooks, fn }
}

export default DashboardSidebarFactory
