<script>
import { computed } from 'vue'
import PosOrder from "./PosOrder";
import PosOrderLayout from "./PosOrderLayout";
import PosOrderToolbar from "./PosOrderToolbar";
import {isMobile} from "../AppSharedStates";
import {orderViewDialog} from "./pos-ui-shared";
import PosOrderSplitOrder from "./Helper/PosOrderSplitOrder";
import PosOrderReceipt from "./Helper/PosOrderReceipt";
import PosOrderMoveItems from "./Helper/PosOrderMoveItems";
import PosOrderVoucherDialog from "./Helper/PosOrderVoucherDialog";
import PosOrderTransferUserDialog from './Helper/PosOrderTransferUserDialog';
import {genScopeId} from "../utils";


export default {
  name: 'Order',
  components: {
    PosOrder,
    PosOrderLayout,
    PosOrderToolbar,
    PosOrderSplitOrder,
    PosOrderReceipt,
    PosOrderMoveItems,
    PosOrderVoucherDialog,
    PosOrderTransferUserDialog
  },
  setup() {
    const orderToolbarHeightStyle = { 'max-height': '64px', height: '64px' }
    const orderMainHeightStyle = computed(() => {
      return isMobile.value ? { 'max-height': '100%' } : { 'max-height': 'calc(100% - 64px)' }
    })

    return genScopeId(() => (
        <>
          <div class="order">
            <div class="order-main" style={orderMainHeightStyle.value}>
              <pos-order-layout style="flex: 1"/>
              <pos-order style={!isMobile.value && {flex: '0 0 25%'}}/>
            </div>
            {!isMobile.value && <pos-order-toolbar style={orderToolbarHeightStyle}/>}
          </div>
          <pos-order-split-order v-model={orderViewDialog.split}/>
          <pos-order-receipt v-model={orderViewDialog.receipt}/>
          <pos-order-move-items v-model={orderViewDialog.move}/>
          <pos-order-voucher-dialog v-model={orderViewDialog.voucher}/>
          <pos-order-transfer-user-dialog v-model={orderViewDialog.changeTableWaiter}/>
        </>
    ))
  }
}
</script>

<style scoped lang="scss">
.order {
  height: 100%;
  display: flex;
  flex-direction: column;

  .order-main {
    flex: 1;
    display: flex;
  }

  .g-toolbar {
    flex: 0 1 auto;
  }
}
</style>
