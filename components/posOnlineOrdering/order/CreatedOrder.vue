<template>
  <div>
    <div style="margin-bottom: 10px">
      <span style="font-family: Muli; font-style: normal; font-weight: bold; font-size: 18px; line-height: 16px; margin-right: 10px">No. {{ order.id }}</span>
      <span>{{ order.customer.name }} - {{ order.customer.phone }}</span>
    </div>
    <order-progress
        :received-time="order.date"
        :preparing-time="order.date"
        :status="order.status"
        :type="order.type"
    />
    <div style="margin-top: 42px; margin-bottom: 20px;">
      <div style="font-family: Muli; font-style: normal; font-weight: bold; font-size: 18px; line-height: 23px;">Order details</div>
      <div v-for="(item, itemIndex) in order.items" :key="itemIndex">
        <img :src="item.image" draggable="false">
        <span>{{ item.name }}</span>
        <span>{{ item.quantity }}</span>
        <span>{{ item.price | currency }}</span>
      </div>
      <div>
        <div style="display: flex">
          <span style="font-weight: bold;">Type: </span> {{ order.type }}
          <g-spacer/>
          <div style="width: 200px; display: flex; justify-content: space-between">
            <span>Total {{ order.items.length }} items</span>
            <span>{{ (order.vSum - order.shippingFee) | currency }}</span>
          </div>
        </div>
        <div style="display: flex;">
          <span style="font-weight: bold;">Payment: </span> {{ order.payment[0].type }}
          <g-spacer/>
          <div style="width: 200px; display: flex; justify-content: space-between">
            <span>Shipping fee:</span>
            <span>{{ order.shippingFee | currency }}</span>
          </div>
        </div>
        <div style="display: flex">
          <span style="font-weight: bold;">Address:</span> {{ order.customer.address }}
          <g-spacer/>
          <span style="width: 200px; display: flex; justify-content: space-between">
            <span>Total:</span>
            <span>{{ order.vSum | currency }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'CreatedOrder',
    props: {
      order: Object,
    },
    filters: {
      currency(value) {
        if (value != null)
          return $t('common.currency') + value.toFixed(2)
        return 0
      }
    },
    data: function () {
      return {}
    },
    computed: {},
    methods: {}
  }
</script>
<style scoped>
</style>
