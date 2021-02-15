<script>
import { genScopeId } from '../../../utils';
import {
  tableNameInput,
  focusTextField,
  addTable,
  getOrderTime,
  manualTables,
  textFieldRef,
  showNumberOfCustomersDialog
} from './pos-order-manual-table-logics';
import { getScopeAttrs } from '../../../../utils/helpers';

import { onActivated, onMounted, ref, withModifiers } from 'vue'
import { initRouter, routeToOrder } from '../RestaurantRoomLogics';

export default {
  setup() {
    initRouter()
    const roomRef = ref(null)
    onMounted(focusTextField)
    onActivated(focusTextField)
    return genScopeId(() =>
        <div class="wrapper col-flex">
          <div class="room-container flex-grow-1" ref={roomRef}>
            {manualTables.value.map(table =>
                <div class="table waves-effect waves-red"
                     onClick={withModifiers(() => routeToOrder(table), ['stop'])}>
                  <div> {table} </div>
                  <div style="font-size: 10px; position: absolute; bottom: 2px">
                    {getOrderTime(table)} mins
                  </div>
                </div>
            )}
          </div>
          <div class="keyboard" {...getScopeAttrs()}>
            <pos-textfield-new label="Table" v-model={tableNameInput.value} ref={textFieldRef}></pos-textfield-new>
            <pos-keyboard-full onEnterPressed={addTable}></pos-keyboard-full>
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
