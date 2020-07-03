<template>
  <dialog-common v-model="value" title="Refund order's transaction confirm">
    <div>Are you sure you want to refund this transaction?</div>
    <div class="mt-2" style="background-color: #eee; padding: 5px; border-radius: 5px;">
      <div class="section-header">Customer info</div>
      <div style="border-bottom: 1px dashed #aaa; padding-bottom: 10px;">
        <div>Name: {{order.customer.name}}</div>
        <div>Phone: {{order.customer.phone}}</div>
        <div v-if="order.customer.address">
          <div>Address: {{order.customer.address}}</div>
          <div>Zipcode: {{order.customer.zipCode}}</div>
        </div>
      </div>
      
      <div class="section-header mt-2">Order info</div>
      <div>
        <div>ID: #{{order.id}}</div>
        <div>Total Amount: {{$t('common.currency', storeLocale)}}{{order.payment[0].value}}</div>
        <div>Order Time: {{order.date | formatDate}}</div>
        <div>Delivery Time: {{order.deliveryTime}}</div>
        <div>
          <div>Item list</div>
          <ol style="margin: 0">
            <li v-for="(item, i) in order.items">
              {{ item.name }} x {{ item.quantity }}
            </li>
          </ol>
        </div>
      </div>
    </div>
    <template #actions>
      <g-btn-bs @click="close" width="100" style="margin: 0">Cancel</g-btn-bs>
      <g-btn-bs @click="submit" background-color="#FF5252" text-color="white" width="100" style="margin: 0">OK</g-btn-bs>
    </template>
  </dialog-common>
</template>
<script>
  import dayjs from 'dayjs';

  export default {
    name: 'dialogOrderTransactionRefundConfirm',
    props: {
      value: Boolean,
      order: Object,
      storeLocale: String,
    },
    filters: {
      formatDate(date) {
        return dayjs(date).format('HH:mm')
      }
    },
    methods: {
      close() {
        this.$emit('input', false)
      },
      submit() {
        this.$emit('submit')
        this.close()
      }
    }
  }
</script>
<style lang="scss" scoped>
  .section-header {
    font-weight: bold;
    font-size: 18px;
  }
</style>
