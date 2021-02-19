<script>
import { watch, computed, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import GTreeFactory from 'pos-vue-framework/src/components/GTreeViewFactory/GTreeFactory'
import {
  formattedCategories
} from '../../Product/product-logic'
import { genScopeId } from '../../utils';
import { ObjectID } from 'bson'
import { createCategory, deleteCategory } from '../../Product/product-logic-be';

export default {
  name: "dialogInventoryRetailCategory",
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, context) {
    const { t } = useI18n()

    const showKeyboard = ref(false)
    const selectedCategory = ref(null)

    const rules = computed(() => {
      let rules = []
      rules.push(val => formattedCategories.value.filter(cate => cate === val).length <= 1 || '')
      return rules
    })

    const newCategorySuffix = computed(() => {
      return formattedCategories.value.length + 1
    })

    const internalValue = computed({
      get: () => {
        return props.modelValue
      },
      set: (value) => {
        showKeyboard.value = false
        context.emit('update:modelValue', value)
      }
    })

    const addCategory = async function () {
      if (selectedCategory.value) {
        await createCategory({
          parentCategory: selectedCategory.value._id,
          name: `Sub category ${category.subCategory.length + 1}`,
          available: true
        })
      } else {
        await createCategory({
          name: `New category ${newCategorySuffix.value}`,
          subCategory: [],
          available: true
        })
      }
    }
    const removeCategory = async function (category) {
      if (!category.available) return
      if(category._id) await deleteCategory(category._id)
    }

    //<editor-fold desc="tree view code">
    const treeViewItemSelected = function (item, state) {
      selectedCategory.value = item
      state.collapse = !state.collapse
    }

    const genNode = function ({node, text, childrenVNodes, isLast, state, path}) {
      return <li onClick={withModifiers(() => treeViewItemSelected(node, state), ['stop'])}>
        {node.name}
        {!state.collapse ? childrenVNodes : null}
      </li>
    }

    const genWrapper = function (childrenVNodes) {
      return <ul>{childrenVNodes}</ul>
    }

    const genRootWrapper = function (childrenVNodes) {
      return (
          <div root>
            <ul>{childrenVNodes}</ul>
          </div>
      )
    }

    const { genTree } = GTreeFactory({
      data: formattedCategories,
      genNode,
      genRootWrapper,
      genWrapper,
      itemChildren: 'subCategory'
    })
    //</editor-fold>

    return () => <>
      <g-dialog fullscreen v-model={internalValue.value} content-class="dialog-inventory-category">
        {/*todo: check this onClick */}
        {genScopeId(() => (
            <div class="dialog" onClick={() => selectedCategory.value = null}>
              <div class={showKeyboard.value ? 'dialog-left' : 'dialog-center'}>
                <div class="dialog-header">
                  Manage categories
                  <g-btn-bs icon="add" onClick={withModifiers(addCategory, ['stop'])}>{t('article.category')}</g-btn-bs>
                </div>
                <div class="category">
                  {genTree()}
                </div>
                <p>* {t('inventory.onlyEmpty')}</p>
                <div class="dialog-action">
                  <g-btn-bs data-jest-addCategory icon="add" background-color="#1271FF" onClick={() => showKeyboard.value = true}>{t('inventory.rename')}</g-btn-bs>
                  <g-btn-bs data-jest-complete class={['category-item__btn', selectedCategory.value && selectedCategory.value.available && 'category-item__btn--delete']}
                    onClick={withModifiers(() => removeCategory(selectedCategory.value), ['stop'])}>
                    <g-icon>icon-delete2</g-icon>
                    {t('inventory.remove')}
                  </g-btn-bs>
                </div>
              </div>
              {
                (showKeyboard.value) &&
                <div class="dialog-keyboard">
                  <pos-keyboard-full type="alpha-number"></pos-keyboard-full>
                </div>
              }
              <div class="dialog-overlay" onClick={() => internalValue.value = false}></div>
            </div>
        ))()}
      </g-dialog>
    </>
  }
}
</script>

<!--<script>-->
<!--export default {-->
<!--  setup() {-->
<!--    return () => -->
<!--  }-->
<!--}-->
<!--</script>-->

<style scoped lang="scss">
.dialog {
  width: 100%;
  height: 100%;
  position: relative;

  &-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    background-color: #21212121;
  }

  &-keyboard {
    position: absolute;
    z-index: 2;
    left: 33%;
    bottom: 0;
    right: 0;
    background-color: #bdbdbd;
    padding: 4px;
  }

  &-center, &-left {
    position: absolute;
    background: white;
    padding: 8px;
    width: 33%;
    z-index: 2;
    display: flex;
    flex-direction: column;

    .category {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;

      & ~ p {
        font-size: 12px;
        font-style: italic;
        color: #757575;
        margin-bottom: 8px;
      }

      &-item {
        display: flex;
        align-items: center;
        padding-right: 4px;

        .bs-tf-wrapper {
          margin: 4px 0 4px 4px;
          flex: 1;

          ::v-deep {
            .bs-tf-inner-input-group {
              border-radius: 4px 0 0 4px;
            }
          }
        }

        &__btn {
          background-color: #bdbdbd;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0 4px 4px 0;

          &--delete {
            background-color: #FF4452;
          }
        }
      }
    }
  }

  &-action {
    display: flex;

    .g-btn-bs {
      margin: 4px;
      flex: 1;
    }
  }

  &-center {
    top: 16px;
    left: 33%;
    bottom: 16px;
  }

  &-left {
    top: 0;
    left: 0;
    bottom: 0;
    right: 33%;
  }
}
</style>

<style>
.g-dialog-wrapper .dialog-inventory-category {
  transition: none;
}
</style>
