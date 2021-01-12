import { computed, ref } from 'vue';
import _ from 'lodash';

import { user } from '../../AppSharedStates'

import {rooms} from '../../View/EditTablePlan/room-state'
import { activeScreen } from '../DashboardSharedStates';
import { onSelectRoom} from '../../View/EditTablePlan/room-state';

//todo: move locale to AppSharedStates
const locale = ref('')

const fetchLocales = async function () {
  const config = await cms.getModel('SystemConfig').findOne({ type: 'I18n' })
  locale.value = (config && config.content && config.content.locale) ? config.content.locale : 'en'
}

const changeLocale = async function (newLocale) {
  locale.value = newLocale
  await cms.getModel('SystemConfig').updateOne({ type: 'I18n' }, { 'content.locale': newLocale }, { upsert: true })
  //should reload login page to apply locale change
}

const DashboardSidebarItemsFactory = ($t) => {

  const dashboardSidebarItems = computed(() => [
    {
      icon: 'icon-restaurant',
      items: rooms.value.map((room) => ({
        title: room.name,
        icon: 'radio_button_unchecked',
        iconType: 'small',
        onClick() {
          console.log('asdfasdf')
          activeScreen.value = 'restaurant-room'
          onSelectRoom(room)
        }
      })),
      title: $t('sidebar.restaurant'),
      feature: 'tablePlan'
    },
    {
      icon: 'icon-manual-table',
      title: $t('sidebar.manualTable'),
      feature: 'manualTable',
      onClick() {
        console.log('click manual table')
      }
    },
    {
      icon: 'icon-delivery',
      title: $t('onlineOrder.onlineOrders'),
      feature: 'onlineOrdering',
      key: 'Dashboard',
      items: [
        {
          icon: 'radio_button_unchecked',
          iconType: 'small',

          title: $t('onlineOrder.dashboard'),
          key: 'Orders'
        },
        {
          icon: 'radio_button_unchecked',
          iconType: 'small',
          title: $t('onlineOrder.completedOrders')
        },
        {
          icon: 'radio_button_unchecked',
          iconType: 'small',
          title: $t('onlineOrder.declinedOrders')
        },
        {
          icon: 'icon-services',
          title: $t('sidebar.services'),
          feature: 'onlineOrdering',
          key: 'Service'
        }
      ],
    },
    {
      icon: 'icon-reservation',
      title: $t('sidebar.reservation'),
      feature: 'reservation',
      key: 'Reservation'
    },
    {
      icon: 'icon-functions',
      title: $t('sidebar.functions')
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
    // if (user.value && this.enabledFeatures) {
    //   sidebar = sidebar.filter(item => {
    //     if (!item.feature) return true
    //     return this.enabledFeatures.includes(item.feature)
    //   })
    // }

    // if (this.showVirtualReportInSidebar) {
    //   sidebar.push({
    //     icon: 'icon-printer',
    //     onClick() {
    //       this.$emit('update:view', {
    //         name: 'VirtualPrinter',
    //         params: ''
    //       })
    //     },
    //     title: 'Virtual Printer'
    //   })
    // }

    const tmp = sidebar.map(item => {
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
    return tmp
  })
  return {
    refactoredDashboardSidebarItems
  }
}

export {
  DashboardSidebarItemsFactory,
  locale
}
