<script>

import { isMobile } from '../../AppSharedStates';
import { execGenScopeId, genScopeId, internalValueFactory } from '../../utils';
import { getCurrentOrder } from '../../OrderView/pos-logic-be';
import { ref } from 'vue'
import DiscountInput from './DiscountInput';

export default {
  name: 'dialogChangeValue2',
  props: {
    modelValue: Boolean,
    newValueEditable: false
  },
  components: { DiscountInput },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const order = getCurrentOrder()
    const showSnackBar = ref(false)
    const dialog = internalValueFactory(props, { emit })

    function submit(update) {
      console.log(update)
      if (order.vSum) {
        const change = +update.value
        if (update.type === 'amount' && change > order.vSum) {
          showSnackBar.value = true
          return
        }
        const discount = update.type === 'amount' ? change : `${change}%`
        emit('submit', discount);
      }
      dialog.value = false;
    }

    function removeDiscount() {
      dialog.value = false
    }

    return genScopeId(() =>
        <g-dialog v-model={dialog.value} overlay-color="#6b6f82" fullscreen={isMobile.value} overlay-opacity="0.95">
          {execGenScopeId(() => <div class="dialog-change w-100" style={[{ background: 'white' }]}>
            <g-icon class="dialog-change--close" onClick={() => dialog.value = false}>close</g-icon>
            <discount-input onSubmit={submit} onRemoveDiscount={removeDiscount}/>
            <g-snackbar v-model={showSnackBar.value} timeout="2000" color="#FF4552">
              <div>Discount exceeds order value!</div>
            </g-snackbar>
          </div>)}
        </g-dialog>)
  }
}
</script>

<style scoped lang="scss">
.dialog-change {
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  position: relative;

  &--close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
  }

  .action {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;

    .g-btn {
      min-width: 120px !important;

      &.g-btn__outlined {
        border: 1px solid #979797;
        color: #1d1d26;
      }
    }
  }

  .keyboard-wrapper {
    background-color: #bdbdbd;
    padding: 16px 180px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    margin-top: -16px;

    .key-number {
      padding: 10px 8px;
      background: #FFFFFF;
      border: 1px solid #979797;
      box-sizing: border-box;
      border-radius: 4px;
      font-family: "Muli", sans-serif;
    }
  }
}
</style>
