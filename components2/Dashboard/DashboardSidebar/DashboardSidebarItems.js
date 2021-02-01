import { computed } from 'vue';
import _ from 'lodash';

import { user } from '../../AppSharedStates'

import { roomsStates } from '../../TablePlan/RoomState'
import { activeScreen, dashboardHooks } from '../DashboardSharedStates';
import { useI18n } from 'vue-i18n'


const DashboardSidebarItemsFactory = () => {
  const { t } = useI18n()
  const dashboardSidebarItems = computed(() => [
    {
      icon: 'icon-restaurant',
      items: roomsStates.value.map((r) => ({
        title: r.room.name,
        icon: 'radio_button_unchecked',
        iconType: 'small',
        onClick() {
          dashboardHooks.emit('updateScreen', 'KeptAliveRoomViews')
          dashboardHooks.emit('selectRoom', r.room._id.toString())
          // onSelectRoom(r)
        }
      })),
      title: t('sidebar.restaurant'),
      feature: 'tablePlan'
    },
    {
      icon: 'icon-manual-table',
      title: t('sidebar.manualTable'),
      feature: 'manualTable',
      onClick() {
        dashboardHooks.emit('updateScreen', 'ManualTableView')
      }
    },
    {
      icon: 'icon-delivery',
      title: t('onlineOrder.onlineOrders'),
      feature: 'onlineOrdering',
      key: 'Dashboard',
      items: [
        {
          icon: 'radio_button_unchecked',
          iconType: 'small',

          title: t('onlineOrder.dashboard'),
          key: 'Orders'
        },
        {
          icon: 'radio_button_unchecked',
          iconType: 'small',
          title: t('onlineOrder.completedOrders')
        },
        {
          icon: 'radio_button_unchecked',
          iconType: 'small',
          title: t('onlineOrder.declinedOrders')
        },
        {
          icon: 'icon-services',
          title: t('sidebar.services'),
          feature: 'onlineOrdering',
          key: 'Service'
        }
      ],
    },
    {
      icon: 'icon-reservation',
      title: t('sidebar.reservation'),
      feature: 'reservation',
      key: 'Reservation'
    },
    {
      icon: 'icon-functions',
      title: t('sidebar.functions'),
      onClick() {
        dashboardHooks.emit('updateScreen', 'FunctionsView')
      }
    }
  ])

  const refactoredDashboardSidebarItems = computed(() => {
    let sidebar = _.cloneDeep(dashboardSidebarItems.value)
    if (user.value && user.value.role !== 'admin') {
      if (!user.value.viewOnlineOrderDashboard) {
        sidebar = sidebar.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Dashboard')
      } else if (!user.value.viewOrder) {
        const onlineOrder = sidebar.find(s => s.feature === 'onlineOrdering' && s.items && s.items.length)
        onlineOrder && onlineOrder.items.splice(1, 2)
      }
      if (!user.value.viewOnlineOrderMenu) {
        sidebar = sidebar.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Service')
      }
      if (!user.value.viewReservation) {
        sidebar = sidebar.filter(s => s.feature !== 'reservation' || s.key !== 'Reservation')
      }
    }

    return sidebar.map(item => {
      switch (item.key) {
        case 'Reservation':
          return {
            ...item,
            ...{ badge: '1' + '', badgeColor: '#FF5252' }
          }
        case 'Dashboard':
          const items = item.items.map(i => {
            if (i.key === 'Orders') {
              return {
                ...i,
                ...{ badge: '2' + '', badgeColor: '#FF5252' }
              }
            }
            return i
          })
          return {
            ...item,
            items
          }
        default:
          return item;
      }
    })
  })
  return {
    refactoredDashboardSidebarItems
  }
}

export default DashboardSidebarItemsFactory
