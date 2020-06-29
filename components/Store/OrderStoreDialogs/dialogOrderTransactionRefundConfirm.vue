<template>
  <dialog-common v-model="value" title="Refund order's transaction confirm">
    <div>Are you sure you want to refund this transaction?</div>
    <div class="mt-2 pa-2" style="border-top: 1px dashed #aaa; border-bottom: 1px dashed #aaa;">
      <div class="fw-700">ID: #{{order.id}}</div>
      <div>Customer Name: {{order.customer.name}}</div>
      <div>Customer Phone: {{order.customer.phone}}</div>
      <div v-if="order.customer.address">
        <div>Customer Address: {{order.customer.address}}</div>
        <div>Zipcode: {{order.customer.zipCode}}</div>
      </div>
      <div>Price: {{$t('common.currency', storeLocale)}}{{order.payment[0].value}}</div>
      <div>Order Time: {{order.date | formatDate}}</div>
      <div>Delivery Time: {{order.deliveryTime}}</div>
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
