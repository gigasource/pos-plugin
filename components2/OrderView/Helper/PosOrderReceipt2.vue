<script>
import {withModifiers} from 'vue'
export default {
  name: 'PosOrderReceipt2',
  props: {
    // modelValue:
  },
  emits: [],
  setup(props, {emits}) {

    const split = ref(false)
    const printed = ref(false)
    const store = ref({})

    const receiptHeaderRenderFn = () => <div className="receipt-main__header">
        <div className="receipt-main__header-title">{ store.name }</div>
        <div className="receipt-main__header-subtitle">{ store.address }</div>
        <div className="receipt-main__header-subtitle">
          <span className="mr-3">Tel: { store.phone }</span>
          <span>VAT Reg No: {store.vat }</span>
        </div>
      </div>

    const receiptTitleRenderFn = () => <div className="receipt-main__title">Table: { order.table }</div>

    const receiptMainRenderFn = () => {

    }
    const receiptRenderFn = () => {
      const toolbarRenderFn = () => <g-toolbar color="#EFEFEF">
        <g-btn-bs width="120" icon="icon-back" class="elevation-2"
        onClick={back}>
        Back
      </g-btn-bs>
      <g-btn-bs width="120" icon="icon-print" class="elevation-2"
        onClick={withModifiers(e => {print(null)}, ['stop'])}>
    Print
    </g-btn-bs>
      <g-btn-bs width="120" icon="icon-receipt2" style="white-space: unset" class="elevation-2">
        <div style="line-height: 0.9">
          <p>Company</p>
          <p>Receipt</p>
        </div>
      </g-btn-bs>
      <g-menu v-model={paymentMethodMenu.value} v-if="!split" content-class="menu-payment-option">
<!--        <template #activator="{on}">-->
<!--          <g-btn-bs class="elevation-2"-->
<!--          icon={activeOrderPaymentItem.icon} v-on="on" disabled={printed}>-->
<!--          <div>{ activeOrderPaymentItem.text }</div>-->
<!--        </g-btn-bs>-->
<!--        </template>-->
      <div class="col-flex">
        {paymentMethodMenuItems.map((item, index) =>
        <g-btn-bs
            class="ml-0 mr-0"
          key={`paymentMethodMenuItems-${index}`}
        icon={item.icon}
        onClick={withModifiers( e=> setOrderPaymentMethod(item), 'stop')}>
        <div>{ item.text }</div>
      </g-btn-bs>)}
    </div>
    </g-menu>
      <g-spacer/>
      <g-btn-bs width="120" background-color="#0EA76F" icon="icon-complete" class="elevation-2" onClick={withModifiers(complete, 'stop')}>
    Complete
    </g-btn-bs>
    </g-toolbar>

    }
  }
}
</script>
