<template>
  <div class="pos-online">
    <pos-dashboard-sidebar
        class="pos-online__sidebar"
        #sidebar
        :view="view"
        :items="sidebarItems"
        default-path="item.0.item.0"/>
    <online-order-main
        class="pos-online__content"
        #content
        :pending-orders="pendingOrders"
        :kitchen-orders="kitchenOrders"/>
  </div>
</template>
<script>
  import PosDashboardSidebar from '../Dashboard/PosDashboardSidebar';
  import OnlineOrderMain from '../OnlineOrder/OnlineOrderMain';
  import {pendingOrders, kitchenOrders} from '../../composition/useOrderLogic';
  import { state as RoomState } from '../../composition/useRoomLogic'
  import { onMounted, ref, reactive } from 'vue';

  export default {
    name: 'Online',
    components: { OnlineOrderMain, PosDashboardSidebar },
    props: {},
    emits: ['update:view'],
    setup(props, context) {
      const view = ref("");
      const sidebarItems = reactive([
        {
          title: "Restaurant",
          icon: "icon-restaurant",
          children: function () {
            return RoomState.rooms.map(room => ({
              title: room.name,
              icon: 'radio_button_unchecked',
              iconType: 'small',
              onClick: () => {
                context.emit('update:view', { name: 'Restaurant', params: { id: room._id } })
              }
            }));
          }
        },
        {
          title: "Manual Table",
          icon: "icon-manual-table",
          onClick: function() {
            // context.emit('update:view', { name: 'ManualTable', params: '' })
          }
        },
        {
          title: "Functions",
          icon: "icon-functions",
          onClick: function() {
            context.emit('update:view', { name: 'Functions', params: '' })
          }
        },
      ])
      
      onMounted(() => {
        const rooms = RoomState.rooms
        if (rooms.length > 0) {
          context.emit('update:view', {
            name: 'Restaurant',
            params: { id: rooms[0]._id }
          })
        }
      })
      
      return {
        pendingOrders,
        kitchenOrders,
        //
        view,
        sidebarItems,
      }
    }
  }
</script>
<style scoped lang="scss">
  .pos-online {
    display: grid;
    grid-template-columns: 220px calc(100% - 220px);
    grid-template-rows: 100%;
    
    &__sidebar {
      grid-area: 1 / 1 / 2 / 2;
      height: 100vh;
    }
    &__content {
      grid-area: 1 / 2 / 2 / 3;
    }
  }
</style>
