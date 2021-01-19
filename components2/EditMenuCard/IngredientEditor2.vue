<script>
import { updateOrderLayout, selectedProduct, selectedProductExisted } from '../OrderView/pos-ui-shared';
import { onActivated } from 'vue';
import { Touch } from 'pos-vue-framework';
import PosKeyboardFull from '../../components/pos-shared-components/PosKeyboardFull';
import _ from 'lodash';
import { getScopeId } from '../../utils/helpers';

export default {
  name: 'IngredientEditor2',
  directives: {
    Touch
  },
  components: { PosKeyboardFull },
  props: {},
  async setup() {
    const showKeyboard = ref(false)
    const inventories = ref([])
    const ingredients = computed(() => {
      if (selectedProductExisted.value) {
        return selectedProduct.value.ingredients.map(item => ({
          inventory: item.inventory,
          amount: Number(item.amount)
        }))
      } else {
        return []
      }
    })

    async function reloadInventories() {
      inventories.value = (await cms.getModel('Inventory').find()).map(item => ({
        text: `${item.name} (${item.unit})`,
        value: item._id
      }))
    }
    onActivated(async() => await reloadInventories())
    /*onCreated*/ await reloadInventories()

    // TODO: meaning name
    const rules = computed(() => {
      let rules = []
      const inventories = ingredients.value.map(item => {
        const invt = inventories.value.find(invt => invt.value === item.inventory)
        return invt ? invt.text : ''
      })
      rules.push(val => inventories.filter(item => item.toString() === val.toString()).length <= 1 || '')
      return rules
    })

    function addIngredient() {
      ingredients.value.unshift({
        inventory: '',
        amount: ''
      })
    }

    function getTouchHandler(index) {
      return {
        right: () => {
          ingredients.value.splice(index, 1)
        }
      }
    }

    async function  updateProductIngredient() {
      const _ingredients = ingredients.value.map(item => ({
        inventory: item.inventory,
        amount: Number(item.amount)
      }))

      if(_.some(_.countBy(_ingredients, 'inventory'), item => item > 1))
        return

      await cms.getModel('Product').findOneAndUpdate({ _id: selectedProduct.value._id }, { ingredients: _ingredients })
      updateOrderLayout(await cms.getModel('OrderLayout').findOne({type: 'default'}))
    }

    const debounceUpdateAmount = _.debounce(updateProductIngredient, 300)

    return getScopeId(() => <>
      {
        (selectedProductExisted.value) ?
            <div class="ingredient-editor" >
              <g-btn-bs style="margin: 0" block background-color="#1271FF" icon="add@16" onClick={addIngredient}>{t('inventory.ingredient')}</g-btn-bs>
              {ingredients.value.map((ingredient, i)  =>
                  <div v-touch="getTouchHandler(i)" class="ingredient-editor__input" key={i}>
                    <g-autocomplete
                        class="ingredient-editor__input--left"
                        text-field-component="GTextFieldBs"
                        virtual-event
                        menu-class="menu-select-inventory"
                        key={ `auto_${ingredients.length - i}` }
                        rules={ rules }
                        items={ inventories }
                        arrow={ false }
                        v-model={ingredient.inventory}
                        onInputClick={showKeyboard.value = true}
                        onUpdate:modelValue={updateProductIngredient}></g-autocomplete>
                    <g-text-field-bs
                        rules={ [val => !isNaN(val) || ''] }
                        class="ingredient-editor__input--right"
                        virtual-event
                        v-model={ingredient.amount}
                        onClick={() => showKeyboard.value = true}
                        onUpdate:modelValue={debounceUpdateAmount}></g-text-field-bs>
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
                      <pos-keyboard-full onEnterPressed={showKeyboard.value = false}></pos-keyboard-full>
                    </div>
                  </div>
                </>
              }
            </div>
            :
            <div style="display: flex; align-items: center; justify-content: center; height: 100%">
              Select product to edit ingredient
            </div>
      }
    </>)
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
