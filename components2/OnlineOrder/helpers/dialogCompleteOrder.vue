<script>
import {
  dialogCompleteOrderFactory
} from './dialog-complete-order-render'

export default {
  props: {
    modelValue: Boolean,
    disableBtn: Boolean,
  },
  setup(props, { emit }) {

    const { renderDialogComplete } = dialogCompleteOrderFactory(props, { emit })

    return () => (
      renderDialogComplete()
    )
  }
}
</script>

<style scoped>
.dashed-gradient {
  height: 1px;
  width: 100%;
  background-image: linear-gradient(to right, #9E9E9E 50%, transparent 50%);
  background-size: 20px 1px;
}

.forward-store {
  display: flex;
  justify-content: center !important;
  align-items: center !important;
  padding: 2px !important;
  margin: 8px 16px 12px;
  text-align: center;
  background-color: #E1F5FE;
  border-radius: 12px !important;
}
</style>
