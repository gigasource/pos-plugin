<script>
import { computed, ref, withModifiers } from 'vue'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { execGenScopeId, genScopeId } from '../../utils';

dayjs.extend(relativeTime)

export default {
  name: 'dialogSavedList',
  props: {
    modelValue: Boolean,
  },
  setup(props, { emit }) {
    const dialogDeleteSave = ref(false)
    const listToDelete = ref(null)
    const internalValue = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    /*OrderStore*/
    const savedOrders = ref()

    /*OrderStore*/
    function selectSavedOrder() {
      console.error('OrderStore::selectSavedOrder not impl')
    }

    /*OrderStore*/
    function removeSavedOrder() {
      console.error('OrderStore::removeSavedOrder not impl')
    }

    const savedLists = computed(() => {
      if (savedOrders.value) {
        return savedOrders.value.map(savedOrder => ({
          _id: savedOrder._id,
          id: savedOrder._id,
          customer: savedOrder.customer,
          quantity: savedOrder.items.reduce((acc, cur) => (acc + cur.quantity), 0),
          date: dayjs(savedOrder.date).fromNow(),
        }))
      }
      return []
    })

    function openDeleteDialog(list) {
      listToDelete.value = list
      dialogDeleteSave.value = true
    }

    function selectList(list) {
      selectSavedOrder(list)
      internalValue.value = false
    }

    function removeList() {
      removeSavedOrder(listToDelete.value)
      dialogDeleteSave.value = false
    }

    function renderRemoveSavedListItemDialog() {
      return (
          <g-dialog v-model={dialogDeleteSave.value} overlay-color="#6b6f82" overlay-opacity="0.95" width="40%" eager>
            {execGenScopeId(() =>
                <g-card class="w-100">
                  {execGenScopeId(() => <>
                    <g-card-title>Confirmation</g-card-title>
                    <g-card-text>
                      Are you sure you want to delete Saved order <b>"{listToDelete.value && listToDelete.value.id}" </b>?
                    </g-card-text>
                    <g-card-actions>
                      {execGenScopeId(() => <>
                        <g-btn uppercase={false} flat outlined onClick={dialogDeleteSave.value = false}>Cancel</g-btn>
                        <g-btn uppercase={false} flat background-color="red lighten 2" text-color="white" onClick={() => removeList()}>OK</g-btn>
                      </>)}
                    </g-card-actions>
                  </>)}
                </g-card>
            )}
          </g-dialog>
      )
    }

    function renderPendingOrders() {
      return (
          <g-simple-table striped fixed-header style="font-size: 14px;">
            {execGenScopeId(() => <>
              <thead>
              <tr>
                <th class="ta-left">Order No.</th>
                <th class="ta-left">Customer</th>
                <th class="ta-right">Qty of Items</th>
                <th class="ta-left">Saved time</th>
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
              {savedLists.value.map((list, i) =>
                  <tr key={i}>
                    <td class="ta-left text-blue">{list.id}</td>
                    <td class="ta-left">{list.customer}</td>
                    <td class="ta-right">{list.quantity}</td>
                    <td class="ta-left">{list.date}</td>
                    <td class="ta-left row-flex justify-center align-items-center">
                      <g-btn uppercase={false} background-color="#1271FF" text-color="white" onClick={withModifiers(() => selectList(list), ['stop'])}>
                        <g-icon class="mr-2" svg>icon-open</g-icon>
                        Select
                      </g-btn>
                      <g-btn uppercase={false} background-color="#FF4452" text-color="white" class="ml-2" onClick={() => openDeleteDialog(list)}>
                        <g-icon class="mr-2" svg>icon-delete</g-icon>
                        Delete
                      </g-btn>
                    </td>
                  </tr>
              )} </tbody>
            </>)}
          </g-simple-table>
      )
    }

    function renderToolbar() {
      return (
          <g-toolbar color="#eee" elevation="2">
            {execGenScopeId(() =>
                <g-btn uppercase={false} background-color="white" className="mr-2" onClick={withModifiers(() => internalValue.value = false, ['stop'])}>
                  <g-icon class="mr-2" svg>icon-back</g-icon>
                  Back
                </g-btn>)}
          </g-toolbar>
      )
    }

    return genScopeId(() => <>
      <div>
        <g-dialog v-model={internalValue.value} overlay-color="#6b6f82" overlay-opacity="0.95" bottom max-width="100%" width="100%" eager>
          <div class="w-100">
            {renderPendingOrders()}
            {renderToolbar()}
          </div>
        </g-dialog>
        {renderRemoveSavedListItemDialog()}
      </div>
    </>)
  },
}
</script>

<style scoped lang="scss">
.g-table {
  height: calc(100% - 64px);

  thead tr th {
    font-size: inherit;
    background-color: white;
  }

  .g-btn {
    margin: 0 8px;
  }
}

.g-card {
  .g-card-title,
  .g-card-text {
    justify-content: center;
    text-align: center;
    color: #1d1d26;
  }

  .g-card-text {
    padding: 32px 64px;
  }

  .g-card-actions {
    justify-content: flex-end;

    .g-btn {
      min-width: 120px !important;

      &.g-btn__outlined {
        border: 1px solid #979797;
        color: #1d1d26;
      }
    }
  }
}
</style>
