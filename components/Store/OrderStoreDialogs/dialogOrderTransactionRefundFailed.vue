<template>
  <g-dialog v-model="value" persistent>
    <div class="dlg">
      <div class="dlg-title">Refund failed</div>
      <div class="dlg-message">
        <div style="font-size: 18px; margin-bottom: 5px;">Refund details:</div>
        <div v-for="(refundCapture, index) in refundCaptures" :key="index" class="refund-capture">
          <div class="refund-capture-header">
            <div>Capture Id: {{ refundCapture.id }}</div>
          </div>
          <div class="refund-capture-body">
            <div>Amount: {{ refundCapture.amount.value }} {{ refundCapture.amount.currency_code }}</div>
            <div>Refund Status: <span class="refund-capture-status" :style="{ color: refundCapture.refundStatusColor }">{{ refundCapture.refundStatus }}</span> </div>
            <div v-if="refundCapture.status === 'COMPLETED' && refundCapture.refundStatus !== 'COMPLETED'">
              <div>Reason: </div>
              {{ refundCapture.refundError }}
            </div>
          </div>
        </div>
        
        <div v-if="error">
          {{ error }}
        </div>
      </div>
      <div class="dlg-buttons">
        <g-btn-bs @click="close" background-color="#2979FF" text-color="white" width="100" style="margin: 0px">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  import _ from 'lodash'
  
  export default {
    name: 'dialogOrderTransactionRefundFailed',
    props: {
      value: Boolean,
      error: String, // un-expected error return from server
      captureResponses: Object,
      refundResponses: Array,
    },
    data() {
      return {}
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(v) {
          this.$emit('input', v)
        }
      },
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
      close() {
        this.internalValue = false
      }
    }
  }
</script>
<style scoped lang="scss">
  .dlg {
    width: 600px;
    margin: 0 auto;
    background: white;
    padding: 24px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    &-title {
      font-size: 20px;
      font-weight: 600;
      color: #212121;
      margin-bottom: 24px;
      align-self: flex-start;
    }
  
    &-message {
      font-size: 15px;
      width: 100%;
      color: #333333;
    }
  
    &-buttons {
      display: inline-flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
  
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
