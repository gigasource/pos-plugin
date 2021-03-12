import { computed } from 'vue'
import _ from 'lodash'
import { generalSettings, user } from '../../AppSharedStates'
import { appType, currentAppType } from '../../AppType'
import { roomsStates } from '../../TablePlan/RoomState'
import { DASHBOARD_VIEWS, dashboardHooks } from '../DashboardSharedStates'
import { useI18n } from 'vue-i18n'
import { pendingOrders } from '../../OnlineOrder/online-order-main-logic';
import { todayPendingReservation } from '../../Reservation/reservation-shared'
import { loadOrders } from '../../OnlineOrder/online-order-main-logic-be';

const DashboardSidebarFactory = () => {
  const { t } = useI18n()
  const defaultSidebarItems = computed(() => {
    return currentAppType.value === appType.POS_RESTAURANT ? [
      {
        icon: 'icon-restaurant',
        items: roomsStates.value.map((r) => ({
          title: r.room.name,
          icon: 'radio_button_unchecked',
          iconType: 'small',
          onClick() {
            dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.KEPT_ALIVE_ROOM_VIEW)
            dashboardHooks.emit('selectRoom', r.room._id.toString())
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
          dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.MANUAL_TABLE_VIEW)
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
            key: 'Orders',
            onClick() {
              dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.ONLINE_ORDER_MAIN_VIEW)
            }
          },
          {
            icon: 'radio_button_unchecked',
            iconType: 'small',
            title: t('onlineOrder.completedOrders'),
            onClick() {
              dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.ONLINE_ORDER_LIST_COMPETED_VIEW)
              dashboardHooks.emit('changeOnlineOrderListStatus', 'completed')
            }
          },
          {
            icon: 'radio_button_unchecked',
            iconType: 'small',
            title: t('onlineOrder.declinedOrders'),
            onClick() {
              dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.ONLINE_ORDER_LIST_DECLINED_VIEW)
              dashboardHooks.emit('changeOnlineOrderListStatus', 'declined')
            }
          },
          {
            icon: 'icon-services',
            title: t('sidebar.services'),
            feature: 'onlineOrdering',
            key: 'Service',
            onClick() {
              dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.ONLINE_ORDER_SERVICE_VIEW)
            }
          }
        ],
      },
      {
        icon: 'icon-reservation',
        title: t('sidebar.reservation'),
        feature: 'reservation',
        key: 'Reservation',
        onClick() {
          dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.RESERVATION_VIEW)
        }
      },
      {
        icon: 'icon-functions',
        title: t('sidebar.functions'),
        feature: 'functions',
        onClick() {
          dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.FUNCTIONS_VIEW)
        }
      }
    ] : [
      {
        icon: 'icon-functions',
        title: t('sidebar.functions'),
        feature: 'functions',
        onClick() {
          dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.FUNCTIONS_VIEW)
        }
      }
    ]
  })

  let showVirtualReportInSidebar = computed(() => {
    return generalSettings.value.useVirtualPrinter
  })

  loadOrders()

  const sidebarItems = computed(() => {
    let _sidebarItems = _.cloneDeep(defaultSidebarItems.value)
    if (currentAppType.value === appType.POS_RESTAURANT && user.value && user.value.role !== 'admin') {
      if (!user.value.viewOnlineOrderDashboard) {
        _sidebarItems = _sidebarItems.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Dashboard')
      } else if (!user.value.viewOrder) {
        const onlineOrder = _sidebarItems.find(s => s.feature === 'onlineOrdering' && s.items && s.items.length)
        //todo: why 2?
        onlineOrder && onlineOrder.items.splice(1, 2)
      }
      if (!user.value.viewOnlineOrderMenu) {
        _sidebarItems = _sidebarItems.filter(s => s.feature !== 'onlineOrdering' || s.key !== 'Service')
      }
      if (!user.value.viewReservation) {
        _sidebarItems = _sidebarItems.filter(s => s.feature !== 'reservation' || s.key !== 'Reservation')
      }
    }

    if (showVirtualReportInSidebar.value) {
      _sidebarItems.push({
        icon: 'icon-printer',
        onClick() {
          dashboardHooks.emit('updateScreen', 'VirtualPrinter')
        },
        title: 'Virtual Printer'
      })
    }

    return currentAppType.value === appType.POS_RESTAURANT ? _sidebarItems.map(item => {
      switch (item.key) {
        case 'Reservation':
          return {
            ...item,
            ...(todayPendingReservation.value ? { badge: todayPendingReservation.value + '', badgeColor: '#FF5252' } : {})
          }
        case 'Dashboard':
          const items = item.items.map(i => {
            if (i.key === 'Orders') {
              return {
                ...i,
                ...(pendingOrders.value.length ? { badge: pendingOrders.value.length + '', badgeColor: '#FF5252' } : {})
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
    }) : _sidebarItems
  })

  return {
    sidebarItems
  }
}

export default DashboardSidebarFactory
