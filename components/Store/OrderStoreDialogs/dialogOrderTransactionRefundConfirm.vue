<template>
  <dialog-common v-model="value" :title="$t('onlineOrder.refundDialog.confirmation')">
    <div>{{ $t('onlineOrder.refundDialog.confirmMessage') }}</div>
    <div class="mt-2" style="background-color: #eee; padding: 5px; border-radius: 5px;">
      <div class="section-header">{{ $t('onlineOrder.refundDialog.customerInfo') }}</div>
      <div style="border-bottom: 1px dashed #aaa; padding-bottom: 10px;">
        <div>{{ $t('onlineOrder.refundDialog.name') }}: {{order.customer.name}}</div>
        <div>{{ $t('onlineOrder.refundDialog.phone') }}: {{order.customer.phone}}</div>
        <div v-if="order.customer.address">
          <div>{{ $t('onlineOrder.refundDialog.address') }}: {{order.customer.address}}</div>
          <div>{{ $t('onlineOrder.refundDialog.zipCode') }}: {{order.customer.zipCode}}</div>
        </div>
      </div>

      <div class="section-header mt-2">{{ $t('onlineOrder.refundDialog.orderInfo') }}</div>
      <div>
        <div>ID: #{{order.id}}</div>
        <div>{{ $t('onlineOrder.refundDialog.totalAmount') }}: {{$t('common.currency', storeLocale)}}{{order.payment[0].value}}</div>
        <div>{{ $t('onlineOrder.refundDialog.orderTime') }}: {{order.date | formatDate}}</div>
        <div>{{ $t('onlineOrder.refundDialog.deliveryTime') }}: {{order.deliveryTime}}</div>
        <div>
          <div>{{ $t('onlineOrder.refundDialog.items') }}</div>
          <ol style="margin: 0">
            <li v-for="(item, i) in order.items">
              {{ item.name }} x {{ item.quantity }}
            </li>
          </ol>
        </div>
      </div>
    </div>
    <template #actions>
      <g-btn-bs @click="close" width="100" style="margin: 0">{{ $t('onlineOrder.refundDialog.cancel') }}</g-btn-bs>
      <g-btn-bs @click="submit" background-color="#FF5252" text-color="white" width="100" style="margin: 0">{{ $t('onlineOrder.refundDialog.ok') }}</g-btn-bs>
    </template>
  </dialog-common>
</template>
<script>
  import dayjs from 'dayjs';

  export default {
    name: 'dialogOrderTransactionRefundConfirm',
    props: {
      modelValue: Boolean,
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
        this.$emit('update:modelValue', false)
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
