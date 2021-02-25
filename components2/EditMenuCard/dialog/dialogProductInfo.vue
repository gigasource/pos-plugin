<script>
import { ref, computed, nextTick, watch } from 'vue'
import PosTextfieldNew from '../../pos-shared-components/POSInput/PosTextfieldNew'
import {internalValueFactory} from "../../utils";
export default {
  name: "dialogProductInfo",
  components: { PosTextfieldNew },
  props: {
    modelValue: null,
    focus: {
      type: String,
      default: 'id'
    },
    product: Object,
  },
  setup(props, { emit }) {
    const id = ref('')
    const name = ref('')
    const price = ref('')
    const product = ref({})
    const textField = ref('')
    const rules = {
      required: val => !!val || 'Required field!',
      number: val => !val || !isNaN(val) || 'Number only field!'
    }
    const internalValue = internalValueFactory(props, { emit })
    const isValid = computed(() => {
      const required = rules.required(name.value)
      const number = rules.number(price.value)
      return typeof required === 'boolean' && typeof number === 'boolean'
    })
    const updateProduct = function () {
      if (name.value || price.value) return
      const change = {
        id: id.value,
        name: name.value,
        price: price.value,
      }
      emit('submit', change, product.value._id)
      internalValue.value = false
    }

    watch(() => internalValue.value, (newVal) => {
      if (newVal) {
        if (product.value) {
          id.value = product.value.id
          name.value = product.value.name
          price.value = product.value.price
        }
        nextTick(() => {
          setTimeout(() => {
            // textField.onFocus()
          }, 200)
        })
      } else {
        this.id = ''
        this.name = ''
        this.price = ''
      }
    })

    return () => (
      <dialog-form-input v-model={internalValue.value} onSubmit={updateProduct} valid={isValid.value} v-slots={{
        input: () => <div class="row-flex justify-between flex-wrap">
          <pos-textfield-new style="width: 48%;" ref="id" label="ID" v-model={id}/>
          <pos-textfield-new style="width: 48%;" ref="name" label="Name" required v-model={name.value} validate-on-blur rules={[rules.required]}/>
          <pos-textfield-new style="width: 48%;" ref="price" label="Price" required v-model={price.value} rules={[rules.number]}/>
        </div>
      }}/>
    )
  }
}
</script>

<style scoped>
</style>
