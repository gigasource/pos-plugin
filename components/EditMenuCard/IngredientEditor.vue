<template>
  <div v-if="layout && layout.product && layout.product._id" class="ingredient-editor">
    <g-btn-bs style="margin: 0" block background-color="#1271FF" icon="add@16" @click="addIngredient">{{$t('inventory.ingredient')}}</g-btn-bs>
    <div v-for="(ingredient, i) in ingredients" v-touch="getTouchHandler(i)" class="ingredient-editor__input" :key="i">
      <g-autocomplete text-field-component="GTextFieldBs" class="ingredient-editor__input--left"
                      @input-click="showKeyboard = true" @update:modelValue="updateProductIngredient"
                      virtual-event menu-class="menu-select-inventory" :key="`auto_${ingredients.length - i}`"
                      :rules="rules" :items="inventories" :arrow="false" v-model="ingredient.inventory"/>
      <g-text-field-bs :rules="[val => !isNaN(val) || '']" class="ingredient-editor__input--right"
                       @click="showKeyboard = true" @update:modelValue="debounceUpdateAmount"
                       virtual-event v-model="ingredient.amount"/>
    </div>
    <div class="ingredient-editor__message">{{$t('inventory.swipeRight')}} <g-icon style="margin-bottom: 2px" color="#757575" size="16">fas fa-angle-double-right</g-icon></div>
    <div v-if="showKeyboard" class="ingredient-editor__keyboard">
      <div class="ingredient-editor__overlay" @click="showKeyboard = false"></div>
      <div class="ingredient-editor__keyboard-wrapper">
        <pos-keyboard-full @enter-pressed="showKeyboard = false"/>
      </div>
    </div>
  </div>
</template>

<script>
  import {Touch} from 'pos-vue-framework';
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';
  import _ from 'lodash'

  export default {
    name: "IngredientEditor",
    directives: {
      Touch
    },
    components: {PosKeyboardFull},
    props: {
      layout: null,
      orderLayout: null
    },
    data() {
      return {
        inventories: [],
        ingredients: [],
        showKeyboard: false,
        debounceUpdateAmount: null
      }
    },
    async created() {
      this.inventories = (await cms.getModel('Inventory').find()).map(item => ({
        text: `${item.name} (${item.unit})`,
        value: item._id
      }))
      if(this.layout && this.layout.product && this.layout.product._id) {
        this.ingredients = this.layout.product.ingredients.map(item => ({
          inventory: item.inventory,
          amount: ''+item.amount
        })) || []
      }
      this.debounceUpdateAmount = _.debounce(this.updateProductIngredient, 300)
    },
    async activated() {
      this.inventories = (await cms.getModel('Inventory').find()).map(item => ({
        text: `${item.name} (${item.unit})`,
        value: item._id
      }))
      if(this.layout && this.layout.product && this.layout.product._id) {
        this.ingredients = this.layout.product.ingredients.map(item => ({
          inventory: item.inventory,
          amount: ''+item.amount
        })) || []
      }
    },
    watch: {
      layout(val) {
        if(val && val.product && val.product._id) {
          this.ingredients = val.product.ingredients.map(item => ({
            inventory: item.inventory,
            amount: ''+item.amount
          })) || []
        } else {
          this.ingredients = []
        }
      }
    },
    computed: {
      rules() {
        let rules = []
        const inventories = this.ingredients.map(item => {
          const invt = this.inventories.find(invt => invt.value === item.inventory)
          return invt ? invt.text : ''
        })
        rules.push(val => inventories.filter(item => item.toString() === val.toString()).length <= 1 || '')
        return rules
      }
    },
    methods: {
      addIngredient() {
        this.ingredients.unshift({
          inventory: '',
          amount: ''
        })
      },
      getTouchHandler(index) {
        return {
          right: () => {
            this.ingredients.splice(index, 1)
          }
        }
      },
      async updateProductIngredient() {
        const ingredients = this.ingredients.map(item => ({
          inventory: item.inventory,
          amount: +item.amount
        }))
        if(_.some(_.countBy(ingredients, 'inventory'), item => item > 1)) {
          return
        }
        await cms.getModel('Product').findOneAndUpdate({
          _id: this.layout.product._id
        }, {
          ingredients,
        })
        this.$emit('update:orderLayout', await cms.getModel('OrderLayout').findOne({type: 'default'}))
      },
    }
  }
</script>

<style scoped lang="scss">
  .ingredient-editor {
    padding: 8px;

    &__input {
      display: flex;
      margin-top: 8px;

      &--left, &--right {
        margin: 0;
        background-color: #F0F0F0;

        ::v-deep .bs-tf-input {
          background: transparent;
        }
      }

      &--left {
        flex: 0 0 70%;

        ::v-deep .bs-tf-wrapper {
          margin: 0;
          width: 100%;

          .bs-tf-inner-input-group {
            border-radius: 4px 0 0 4px;
            border-right: none;
          }
        }
      }

      &--right {
        flex: 0 0 30%;

        ::v-deep .bs-tf-inner-input-group {
          border-radius: 0 4px 4px 0;
        }
      }
    }

    &__message {
      margin-top: 4px;
      font-size: 13px;
      font-weight: 700;
      font-style: italic;
      color: #757575;
    }

    &__keyboard {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 30%;
      z-index: 10;
      display: flex;
      flex-direction: column;

      &-wrapper {
        padding: 6px;
        background: #bdbdbd;
      }
    }

    &__overlay {
      flex: 1;
      background: rgba(107, 111, 130, 0.7);
    }
  }
</style>
