<script>
import { ref, computed, nextTick, watch } from 'vue'
import PosTextfieldNew from '../../pos-shared-components/POSInput/PosTextfieldNew'
import {internalValueFactory} from "../../utils";
import { useI18n } from 'vue-i18n';
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
    const { t } = useI18n()
    const refComp = {
      id: ref(null),
      name: ref(null),
      price: ref(null)
    }
    let product
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
      if (name.value && price.value) {
        const change = {
          id: id.value,
          name: name.value,
          price: Number(price.value),
        }
        emit('submit', change, true)
      }
      internalValue.value = false
    }

    watch(() => props.modelValue, async (newVal) => {
      if (newVal) {
        const { focus } = props
        product = props.product
        if (product) {
          id.value = product.id
          name.value = product.name
          price.value = product.price
        }
        if (focus) {
          nextTick(() =>
              setTimeout(() => refComp[focus]._rawValue.$refs.textfield.onFocus(), 200)
          )
        }
      } else {
        id.value = ''
        name.value = ''
        price.value = ''
      }
    })

    return () => (
      <dialog-form-input v-model={internalValue.value} onSubmit={updateProduct} valid={isValid.value} v-slots={{
        input: () => <div class="row-flex justify-between flex-wrap">
          <pos-textfield-new style="width: 48%;" ref={refComp['id']} label="ID" v-model={id.value}/>
          <pos-textfield-new style="width: 48%;" ref={refComp['name']} label={t('product.name')} required v-model={name.value} validate-on-blur rules={[rules.required]}/>
          <pos-textfield-new style="width: 48%;" ref={refComp['price']} label={t('product.price')} required v-model={price.value} rules={[rules.number]}/>
        </div>
      }}/>
    )
  }
}
</script>

<style scoped>
</style>
