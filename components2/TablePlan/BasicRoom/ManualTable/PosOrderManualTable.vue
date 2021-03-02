<script>
import { genScopeId } from '../../../utils';
import {
  tableNameInput,
  focusTextField,
  addTable,
  getOrderTime,
  manualTables,
  textFieldRef,
  showNumberOfCustomersDialog,
  manualOrders
} from './pos-order-manual-table-logics';
import { getScopeAttrs } from '../../../../utils/helpers';

import { onActivated, onBeforeUnmount, onMounted, ref, withModifiers } from 'vue'
import { initRouter, routeToOrder } from '../RestaurantRoomLogics';
import { getDiffTime } from '../../../../utils/commons';
import { useI18n } from 'vue-i18n';
import { appHooks } from '../../../AppSharedStates';

export default {
  setup() {
    const { t, locale } = useI18n()
    initRouter()
    const roomRef = ref(null)
    const now = ref(new Date())
    const timerInterval = setInterval(() => {
      now.value = new Date()
    })
    onMounted(focusTextField)
    onActivated(() => {
      console.log('activated')
      focusTextField()
      appHooks.emit('orderChange')
    })
    appHooks.emit('orderChange')

    onBeforeUnmount(() => {
      if (timerInterval) clearInterval(timerInterval)
    })
    return genScopeId(() =>
        <div class="wrapper col-flex">
          <div class="room-container flex-grow-1" ref={roomRef}>
            {manualOrders.value.map(order =>
                <div class="table waves-effect waves-red"
                     onClick={withModifiers(() => routeToOrder(order.table), ['stop'])}>
                  <div style={`font-size: 10px; position: absolute; top: 2px`}>
                    {t('common.currency', locale.value)}{order.vSum}
                  </div>
                  <div> {order.table} </div>
                  <div style="font-size: 10px; position: absolute; bottom: 2px">
                    {getDiffTime(order.date, now.value)} mins
                  </div>
                </div>
            )}
          </div>
          <div class="keyboard">
            <pos-textfield-new label="Table" v-model={tableNameInput.value} ref={textFieldRef}/>
            <pos-keyboard-full onEnterPressed={addTable}/>
          </div>
        </div>
    )
  }
}
</script>


<style scoped lang="scss">
.wrapper {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  height: 100%;
  width: 100%;

  :deep .room-container {
    display: flex;
    flex-direction: row;
    padding: 32px;

    .table {
      height: 70px;
      width: 80px;
      background: #fec8c8;
      border: 1px solid #d2691e;
      border-radius: 5px;
      margin-right: 16px;
      margin-bottom: 16px;
      font-weight: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
  }
}

.keyboard {
  background-color: #bdbdbd;
  padding: 1rem;
}

:deep .g-tf-wrapper {
  margin: 0 0 8px 0;
  width: 100%;

  fieldset {
    background-color: #FFF;
    border: 0;
  }
}
</style>
