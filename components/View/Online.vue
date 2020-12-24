<template>
  <g-grid-layout style="height: 100%" :layout="layout">
    <!-- slotScoped id??? -->
    <pos-dashboard-sidebar
        #sidebar
        :view="view"
        :items="sidebarItems"
        default-path="item.0.item.0"/>
    <online-order-main
        #content
        :pending-orders="pendingOrders"
        :kitchen-orders="kitchenOrders"/>
  </g-grid-layout>
</template>
<script>
  import PosDashboardSidebar from '../Dashboard/PosDashboardSidebar';
  import OnlineOrderMain from '../OnlineOrder/OnlineOrderMain';
  import {pendingOrders, kitchenOrders} from '../../composition/useOrderLogic';
  import { state as RoomState } from '../../composition/useRoomLogic'
  import { onMounted } from 'vue';

  export default {
    name: 'Online',
    components: { OnlineOrderMain, PosDashboardSidebar },
    props: {},
    emits: ['update:view'],
    setup(props, context) {
      const layout = {
        "name": "app",
            "top": -1,
            "left": -1,
            "width": 0,
            "height": 0,
            "margin": "",
            "padding": "",
            "bgColor": "hsl(80, 100%, 50%, 50%)",
            "alignSelf": "",
            "justifySelf": "",
            "wrapInDiv": false,
            "displayFlex": false,
            "flexDirection": "row",
            "flexWrap": false,
            "flexJustifyContent": "",
            "flexAlignItems": "",
            "flexAlignContent": "",
            "flexOrder": "",
            "flexGrow": "",
            "flexShrink": "",
            "flexBasis": "",
            "flexAlignSelf": "",
            "alignItems": "",
            "alignContent": "",
            "justifyItems": "",
            "justifyContent": "",
            "columns": [
              "220px",
              "calc(100% - 220px)"
            ],
            "rows": [
              "100%"
            ],
            "columnGap": 0,
            "rowGap": 0,
            "subAreas": [
          {
            "name": "sidebar",
            "top": 1,
            "left": 1,
            "width": 1,
            "height": 1,
            "margin": "",
            "padding": "",
            "bgColor": "hsl(293, 100%, 50%, 50%)",
            "alignSelf": "",
            "justifySelf": "",
            "wrapInDiv": false,
            "displayFlex": false,
            "flexDirection": "row",
            "flexWrap": false,
            "flexJustifyContent": "",
            "flexAlignItems": "",
            "flexAlignContent": "",
            "flexOrder": "",
            "flexGrow": "",
            "flexShrink": "",
            "flexBasis": "",
            "flexAlignSelf": ""
          },
          {
            "name": "content",
            "top": 1,
            "left": 2,
            "width": 1,
            "height": 1,
            "margin": "",
            "padding": "",
            "bgColor": "hsl(331, 100%, 50%, 50%)",
            "alignSelf": "",
            "justifySelf": "",
            "wrapInDiv": false,
            "displayFlex": false,
            "flexDirection": "row",
            "flexWrap": false,
            "flexJustifyContent": "",
            "flexAlignItems": "",
            "flexAlignContent": "",
            "flexOrder": "",
            "flexGrow": "",
            "flexShrink": "",
            "flexBasis": "",
            "flexAlignSelf": ""
          }
        ]
      };
      const view = reactive("");
      const sidebarItems = [
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
      ]
      
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
        layout
      }
    }
  }
</script>
<style scoped>
</style>
