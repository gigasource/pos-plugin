<script>
import _ from 'lodash';
import { Touch } from 'pos-vue-framework'
import { onActivated, ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { genScopeId } from '../../utils'
import {
  selectedProduct,
  selectedProductExisted,
  loadOrderLayout
} from '../../OrderView/pos-ui-shared'
import PosKeyboardFull from '../../pos-shared-components/PosKeyboardFull'
import {
  detailInventories
} from '../../Inventory/inventory-logic-ui'
import {loadInventories} from "../../Inventory/inventory-logic-be";
import {loadCategories} from "../../Product/product-logic-be";
import {loadProducts} from "../../Product/product-logic-be";

export default {
  name: 'IngredientEditor2',
  directives: {
    Touch
  },
  components: { PosKeyboardFull },
  props: {},
  setup() {
    const { t } = useI18n()
    const showKeyboard = ref(false)
    const ingredients = ref([])

    const productInventoryName = computed(() => {
      return detailInventories.value.map((inventory) => inventory.product.name)
    })

    function loadIngredients() {
      if (selectedProductExisted.value) {
        if (!selectedProduct.value.ingredients)
          selectedProduct.value.ingredients = []
        ingredients.value = selectedProduct.value.ingredients.map(item => ({
          name: item.name,
          amount: '' + item.amount
        }))
      } else {
        ingredients.value = []
      }
    }

    // reload ingredients each time product changed
    watch(selectedProduct, () => loadIngredients())

    onMounted(async () => {
      /*onCreated*/ loadIngredients();
      await loadCategories()
      await loadProducts()
      await loadInventories()
    })

    const rules = computed(() => {
      let rules = []
      const _inventories = ingredients.value.map(item => {
        const inventory = detailInventories.value.find(invt => invt.product.name === item.name)
        return inventory ? inventory.product.name : ''
      })
      rules.push(val => _inventories.filter(item => item.toString() === val.toString()).length <= 1 || '')
      return rules
    })

    const addIngredient = () => ingredients.value.unshift({ inventory: '', amount: '' })
    const getTouchHandler = (index) => ({
      right: () => ingredients.value.splice(index, 1)
    })

    async function  updateProductIngredient() {
      const _ingredients = ingredients.value.map(item => ({
        inventory: detailInventories.value.find(inventory => inventory.product.name === item.name)._id,
        name: item.name,
        amount: Number(item.amount)
      }))
      if(_.some(_.countBy(_ingredients, 'inventory'), item => item > 1))
        return
      await cms.getModel('Product').findOneAndUpdate({ _id: selectedProduct.value._id }, { ingredients: _ingredients })
      await loadOrderLayout()
    }

    const debounceUpdateAmount = _.debounce(updateProductIngredient, 300)

    //fixme: i18n
    const renderNoProductSelected = () => <div style="display: flex; align-items: center; justify-content: center; height: 100%">
      {t('restaurant.menuEdit.mustSelectProduct')}
    </div>

    const renderIngredientEditor = () => {
      return (
          <div class="ingredient-editor">
            <g-btn-bs style="margin: 0" block background-color="#1271FF" icon="add@16" onClick={addIngredient}>{t('inventory.ingredient')}</g-btn-bs>
            {ingredients.value.map((ingredient, i) =>
                <div v-touch="getTouchHandler(i)" class="ingredient-editor__input" key={i}>
                  <g-autocomplete
                      class="ingredient-editor__input--left"
                      text-field-component="GTextFieldBs"
                      virtual-event
                      menu-class="menu-select-inventory"
                      key={`auto_${ingredients.length - i}`}
                      rules={rules.value}
                      items={productInventoryName.value}
                      arrow={false}
                      v-model={ingredient.name}
                      onInputClick={() => showKeyboard.value = true}
                      onUpdate:modelValue={updateProductIngredient}/>
                  <g-text-field-bs
                      rules={[val => !isNaN(val) || '']}
                      class="ingredient-editor__input--right"
                      virtual-event
                      v-model={ingredient.amount}
                      onClick={() => showKeyboard.value = true}
                      onUpdate:modelValue={debounceUpdateAmount}/>
                </div>
            )}
            <div class="ingredient-editor__message">
              {t('inventory.swipeRight')}
              <g-icon style="margin-bottom: 2px" color="#757575" size="16">fas fa-angle-double-right</g-icon>
            </div>
            {
              (showKeyboard.value) && <>
                <div class="ingredient-editor__keyboard">
                  <div class="ingredient-editor__overlay" onClick={() => showKeyboard.value = false}></div>
                  <div class="ingredient-editor__keyboard-wrapper">
                    <pos-keyboard-full onEnterPressed={() => showKeyboard.value = false}></pos-keyboard-full>
                  </div>
                </div>
              </>
            }
          </div>
      )
    }

    return genScopeId(() => selectedProductExisted.value ? renderIngredientEditor() : renderNoProductSelected())
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
