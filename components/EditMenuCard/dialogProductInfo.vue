<template>
  <dialog-form-input v-model="internalValue" @submit="updateProduct" :valid="isValid">
    <template #input>
      <div class="row-flex justify-between flex-wrap">
        <pos-textfield-new style="width: 48%;" ref="id" label="ID" v-model="id"/>
        <pos-textfield-new style="width: 48%;" ref="name" label="Name" required v-model="name" validate-on-blur :rules="[rules.required]"/>
        <pos-textfield-new style="width: 48%;" ref="price" label="Price" v-model="price" :rules="[rules.number]"/>
      </div>
    </template>
  </dialog-form-input>
</template>

<script>
  import {log} from "../../../../backoffice/public/js/monaco-editor-core/esm/vs/editor/standalone/common/monarch/monarchCommon";
  import PosTextfieldNew from '../pos-shared-components/POSInput/PosTextfieldNew';

  export default {
    name: "dialogProductInfo",
    components: { PosTextfieldNew },
    props: {
      value: null,
      focus: {
        type: String,
        default: 'id'
      },
      product: Object,
    },
    data() {
      return {
        id: '',
        name: '',
        price: '',
        rules: {
          required: val => !!val || 'Required field!',
          number: val => !val || !isNaN(val) || 'Number only field!'
        }
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      isValid() {
        const required = this.rules.required(this.name)
        const number = this.rules.number(this.price)
        return typeof required === 'boolean' && typeof number === 'boolean'
      }
    },
    watch: {
      internalValue(val) {
        if(val) {
          if(this.product) {
            this.id = this.product.id
            this.name = this.product.name
            this.price = this.product.price
          }
          this.$nextTick(() => {
            setTimeout(() => {
              this.$refs[this.focus].$refs.textfield.onFocus()
            }, 200)
          })
        } else {
          this.id = ''
          this.name = ''
          this.price = ''
        }
      }
    },
    methods: {
      updateProduct() {
        const change = {
          id: this.id,
          name: this.name,
          price: this.price,
        }
        this.$emit('submit', change, !this.product._id)
        this.internalValue = false
      }
    }
  }
</script>

<style scoped>
</style>
