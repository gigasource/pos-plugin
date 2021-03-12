<template>
  <dialog-common v-model="modelValue" :title="$t('onlineOrder.refundFailedDialog.title')">
    <div style="font-size: 18px; margin-bottom: 5px;">{{ $t('onlineOrder.refundFailedDialog.detail') }}:</div>
    <div v-for="(rc, index) in refundCaptures" :key="index" class="refund-capture">
      <div class="refund-capture-header">
        <div>{{ $t('onlineOrder.refundFailedDialog.transactionId') }}: {{ rc.id }}</div>
      </div>
      <div class="refund-capture-body">
        <div>{{ $t('onlineOrder.refundFailedDialog.amount') }}: {{ rc.amount.value }} {{ rc.amount.currency_code }}</div>
        <div>{{ $t('onlineOrder.refundFailedDialog.refundStatus') }}: <span class="refund-capture-status" :style="{ color: rc.refundStatusColor }">{{ rc.refundStatus }}</span></div>
        <div v-if="rc.status === 'COMPLETED' && rc.refundStatus !== 'COMPLETED'">
          <div>{{ $t('onlineOrder.refundFailedDialog.reason') }}: </div>
          {{ rc.refundError }}
        </div>
      </div>
    </div>
    <div v-if="error">{{ error }} </div>
    <template #actions>
      <g-btn-bs @click="closeDialog" background-color="#2979FF" text-color="#fff" width="100" style="margin: 0">{{ $t('onlineOrder.refundFailedDialog.ok') }}</g-btn-bs>
    </template>
  </dialog-common>
</template>
<script>
  import _ from 'lodash'
  export default {
    name: 'dialogOrderTransactionRefundFailed',
    props: {
      modelValue: Boolean,
      error: String, // un-expected error return from server
      captureResponses: Object,
      refundResponses: Array,
    },
    computed: {
      refundCaptures () {
        let self = this
        const captures = []
        _.each(this.captureResponses.purchase_units, purchase_unit => {
          captures.push(..._.filter(purchase_unit.payments.captures, capture => capture.status === "COMPLETED"))
        })
        return _.map(captures, capture => {
          const refundDetail = _.find(self.refundResponses, r => r.captureId === capture.id)
          const refundStatus = refundDetail && refundDetail.status || 'NO INFO'
          return {
            id: capture.id,
            amount: capture.amount,
            status: capture.status,
            refundStatus,
            refundStatusColor: refundStatus === 'COMPLETED' ? '#00fa00' : '#fc3300',
            refundError: refundDetail && refundDetail.detail
          }
        })
      }
    },
    methods: {
      closeDialog() {
        this.$emit('update:modelValue', false)
      }
    }
  }
</script>
<style scoped lang="scss">
  .refund-capture {
    background-color: #eee;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.3);
    border-radius:10px;

    &-header {
      padding: 10px;
      border-bottom: 1px solid #ccc;
    }

    &-body {
      padding: 10px;
    }

    &-status {
      background-color: #ccc;
      padding: 3px 5px;
      border-radius: 2px;
    }
  }
</style>
