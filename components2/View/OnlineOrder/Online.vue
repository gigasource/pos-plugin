<script>
import { computed, onBeforeMount } from 'vue';
import { roomsStates } from '../../TablePlan/RoomState';
import { fetchRooms } from '../../TablePlan/RoomState';
import { pendingOrders, kitchenOrders} from '../../../composition/useOrderLogic';

export default {
  setup() {
    const view = ref(null)
    const sidebarItems = computed(() => ([
      {
        title: 'Restaurant',
        icon: 'icon-restaurant',
        children: function () {
          return roomsStates.value.map(roomState => ({
            title: roomState.room.name,
            icon: 'radio_button_unchecked',
            iconType: 'small',
            onClick: () => {
              context.emit('update:view', { name: 'Restaurant', params: { id: roomState.room._id } })
            }
          }));
        }
      },
      {
        title: 'Manual Table',
        icon: 'icon-manual-table',
        onClick: function () {
          // context.emit('update:view', { name: 'ManualTable', params: '' })

      },
      {
        title: 'Functions',
        icon: 'icon-functions',
        onClick: function () {
          context.emit('update:view', { name: 'Functions', params: '' })
        }
      },
    ]))
    onBeforeMount(async () => {
      await fetchRooms()
    })
    return () =>
        <div class="pos-online">
          <pos-dashboard-sidebar class="pos-online__sidebar" view={view} items={sidebarItems.value} default-path="item.0.item.0">
          </pos-dashboard-sidebar>
          <online-order-main class="pos-online__content" pendingOrders={pendingOrders.value} kitchenOrders={kitchenOrders.value}>
          </online-order-main>
        </div>
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
