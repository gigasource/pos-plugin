<script>

import PosOrder2 from "./PosOrder2";
import PosOrderLayout2 from "./PosOrderLayout2";
import PosQuickOrderToolbar2 from "./Helper/PosQuickOrderToolbar2";
import {isMobile} from "../AppSharedStates";
import {orderViewDialog} from "./pos-ui-shared";
import PosOrderSplitOrder2 from "./Helper/PosOrderSplitOrder2";
import PosOrderReceipt2 from "./Helper/PosOrderReceipt2";
import PosOrderMoveItems2 from "./Helper/PosOrderMoveItems2";
import PosOrderVoucherDialog2 from "./Helper/PosOrderVoucherDialog2";
import {genScopeId} from "../utils";


export default {
  name: 'Order2',
  components: {
    PosOrder2,
    PosOrderLayout2,
    PosQuickOrderToolbar2,
    PosOrderSplitOrder2,
    PosOrderReceipt2,
    PosOrderMoveItems2,
    PosOrderVoucherDialog2
  },
  setup() {
    const a = () => <>
      <pos-order-split-order2 v-model={orderViewDialog.split}/>
      <pos-order-receipt2 v-model={orderViewDialog.receipt}/>
      <pos-order-move-items2 v-model={orderViewDialog.move}/>
      <pos-order-voucher-dialog2 v-model={orderViewDialog.voucher}/>
    </>

    return genScopeId(() => (
        <>
          <div class="order">
            <div class="order-main">
              <pos-order-layout2 style="flex: 1"/>
              <pos-order2 style={!isMobile.value && {flex: '0 0 25%'}}/>
            </div>
            {!isMobile.value && <pos-quick-order-toolbar2/>}
          </div>
          <pos-order-split-order2 v-model={orderViewDialog.split}/>
          <pos-order-receipt2 v-model={orderViewDialog.receipt}/>
          <pos-order-move-items2 v-model={orderViewDialog.move}/>
          <pos-order-voucher-dialog2 v-model={orderViewDialog.voucher}/>
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
