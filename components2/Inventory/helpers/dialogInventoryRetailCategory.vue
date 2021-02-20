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

    function addSubCategory(node, path) {

    }

    const genNode = function ({node, text, childrenVNodes, isLast, state, path}) {
      console.log('genNode', state.selected)
      return <li>
        <div class="row-flex align-items-center" style={{ backgroundColor: state.selected ? '#1271FF' : '#FFF', borderRadius: '4px'}}>
          <div class="row-flex align-items-center mr-3" onClick={withModifiers(() => treeViewItemSelected(node, state), ['stop'])}>
            { !node.parentCategory && <g-icon style="width: 10px" small class="mr-2">{!state.collapse ? 'fas fa-angle-right': 'fas fa-angle-up'}</g-icon> }
            { node.parentCategory && <span style="border-bottom: 2px solid #000; width: 15px; display: inline-block; margin-right: 5px"></span> }
            <span style={{ fontWeight: node.parentCategory ? 'normal' : 'bold' }}>{node.name}</span>
          </div>
          { !node.parentCategory &&
            <g-btn flat rounded elevation={0} background-color="#1271FF" style="width: 20px; min-width: 20px" x-small onClick={withModifiers(() => addSubCategory(node, path), ['stop'])}>
              <g-icon x-small color="#FFF">add</g-icon>
            </g-btn>
          }
        </div>

        {!state.collapse ? childrenVNodes : null}
      </li>
    }

    const genWrapper = function (childrenVNodes) {
      return <ul style="list-style-type: none; border-left: 2px solid #000; padding-left: 0; margin-left: 25px;">{childrenVNodes}</ul>
    }

    const genRootWrapper = function (childrenVNodes) {
      return (
          <div root>
            <ul style="list-style-type: none; padding-left: 0;">{childrenVNodes}</ul>
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
                <div class="row-flex justify-between align-items-center">
                  <span style="font-size: 14px; font-weight: bold">Manage categories</span>
                  <g-btn-bs style="font-size: 14px; margin: 0" background-color="#E1E3EB" onClick={withModifiers(addCategory, ['stop'])}>
                    <g-icon small>add</g-icon>
                    {t('article.category')}
                  </g-btn-bs>
                </div>
                <div class="category">
                  {genTree()}
                </div>
                <p>* {t('inventory.onlyEmpty')}</p>
                <div class="dialog-action">
                  <g-btn-bs icon="edit" small background-color="#1271FF" onClick={() => showKeyboard.value = true}>{t('inventory.rename')}</g-btn-bs>
                  <g-btn-bs small background-color="#FF4452" class={['category-item__btn', selectedCategory.value && selectedCategory.value.available && 'category-item__btn--delete']}
                    onClick={withModifiers(() => removeCategory(selectedCategory.value), ['stop'])}>
                    <g-icon small>icon-delete2</g-icon>
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
    padding: 14px;
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
