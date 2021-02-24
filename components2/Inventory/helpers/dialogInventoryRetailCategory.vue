<script>
import { computed, ref, watch, withModifiers, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import GTreeFactory from 'pos-vue-framework/src/components/GTreeViewFactory/GTreeFactory'
import { formattedCategories } from '../../Product/product-logic'
import { genScopeId } from '../../utils';
import { createCategory, updateCategory, deleteCategory } from '../../Product/product-logic-be';

export default {
  name: 'dialogInventoryRetailCategory',
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
      if (!category.available)
        return
      if (category._id)
        await deleteCategory(category._id)
    }

    const treeViewItemSelected = function (item, state) {
      // skip select category when another category in edit mode
      if (showKeyboard.value) {
        return
      }

      // otherwise, select another category
      selectedCategory.value = item
    }

    function toggleNode(item, state) {
      state.collapse = !state.collapse
    }

    function addSubCategory(node, path) {

    }

    const editingCategoryName = ref(null)
    const refInput = ref()

    watch(() => [showKeyboard.value], async () => {
      await nextTick();
      if (refInput.value) {
        refInput.value.$refs.input.focus()
      }
    })

    function renderName(node, state) {
      if (showKeyboard.value && selectedCategory.value && selectedCategory.value._id === node._id) {
        return <g-text-field-bs v-model={editingCategoryName.value} ref={refInput}/>
      } else {
        const nonSelectedNodeStyle = { color: '#000', backgroundColor: '#FFF' }
        const selectedNodeStyle = { color: '#FFF', backgroundColor: '#1271FF' }
        const style = {
          padding: '4px 8px',
          fontWeight: node.parentCategory ? 'normal' : 'bold',
          borderRadius: '4px',
          ...(selectedCategory.value && selectedCategory.value._id === node._id ? selectedNodeStyle : nonSelectedNodeStyle)
        }
        return <span style={style} onClick={withModifiers(() => treeViewItemSelected(node, state), ['stop'])}>{node.name}</span>
      }
    }

    const genNode = function ({ node, text, childrenVNodes, isLast, state, path }) {
      return <li>
        <div class="row-flex align-items-center">
          <div class="row-flex align-items-center mr-1">
            {!node.parentCategory && <g-icon
                onClick={() => toggleNode(node, state)}
                style="width: 10px" small class="mr-2">
              {!state.collapse ? 'fas fa-angle-right' : 'fas fa-angle-up'}
            </g-icon>}

            {node.parentCategory && <>
              {isLast &&
              <div style="margin-left: -2px;border: 1px solid #fff;width: 2px;height: 16px;display: inline-block; margin-top: 18px; "></div>}
              <span style="border-bottom: 2px solid #000; width: 15px; display: inline-block; margin-right: 5px"></span>
            </>}

            {renderName(node, state)}
          </div>
          {!node.parentCategory &&
          <g-btn flat rounded elevation={0} background-color="#1271FF" x-small
                 style="width: 20px; min-width: 20px"
                 onClick={withModifiers(() => addSubCategory(node, path), ['stop'])}>
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

    function showEditCategoryNameKeyboard() {
      console.log('showEditCategoryNameKeyboard', selectedCategory.value)
      showKeyboard.value = true
      editingCategoryName.value = selectedCategory.value.name
    }

    return () => <>
      <g-dialog fullscreen v-model={internalValue.value} content-class="dialog-inventory-category">
        {/*todo: check this onClick */}
        {genScopeId(() => (
            <div class="dialog">
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
                  <g-btn-bs icon="edit" small background-color="#1271FF" onClick={() => showEditCategoryNameKeyboard()}>{t('inventory.rename')}</g-btn-bs>
                  <g-btn-bs disabled={!selectedCategory.value} small background-color="#FF4452" class={['category-item__btn', selectedCategory.value && selectedCategory.value.available && 'category-item__btn--delete']}
                            onClick={withModifiers(() => removeCategory(selectedCategory.value), ['stop'])}>
                    <g-icon small>icon-delete2</g-icon>
                    {t('inventory.remove')}
                  </g-btn-bs>
                </div>
              </div>
              {
                (showKeyboard.value) &&
                <div class="dialog-keyboard">
                  <pos-keyboard-full type="alpha-number" onEnterPressed={async val => {
                    await updateCategory(selectedCategory.value._id, { name: val })
                    // TODO: update current category name in UI
                    showKeyboard.value = false
                  }}/>
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
