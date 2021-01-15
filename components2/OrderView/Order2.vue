<script>

import PosOrder2 from "./PosOrder2";
import PosOrderLayout2 from "./PosOrderLayout2";
import PosQuickOrderToolbar2 from "./Helper/PosQuickOrderToolbar2";
import {isMobile} from "../AppSharedStates";
import {orderViewDialog} from "./pos-ui-shared";

export default {
  name: 'Order2',
  components: {
    PosOrder2,
    PosOrderLayout2,
    PosQuickOrderToolbar2,
  },
  setup() {
    return () => (<>
      <div class="order">
        <div class="order-main">
          <pos-order-layout2 style="flex: 1"/>
          <pos-order style={!isMobile.value && {flex: '0 0 25%'}}/>
        </div>
        {isMobile.value && <pos-quick-order-toolbar/>}
      </div>
      <pos-order-split-order v-model={orderViewDialog.value.split}/>
      <pos-order-receipt v-model={orderViewDialog.value.receipt}/>
      <pos-order-move-items v-model={orderViewDialog.value.move}/>
      <pos-order-voucher-dialog v-model={orderViewDialog.value.voucher}/>
    </>)
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
