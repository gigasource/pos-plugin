<script>
import { ref, watch, computed, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { $filters } from '../../AppSharedStates';
import _ from 'lodash'
import {
  inventoryCategories
} from '../inventory-logic-ui'
import {
  deleteInventoryCategory,
  updateInventoryCategories
} from '../inventory-logic-be'
import { genScopeId } from '../../utils';

export default {
  name: "dialogInventoryCategory",
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, context) {
    const { t } = useI18n()
    const showKeyboard = ref(false)
    const addedCategory = ref([])

    const internalValue = computed({
      get: () => {
        return props.modelValue
      },
      set: (value) => {
        showKeyboard.value = false
        context.emit('update:modelValue', value)
      }
    })
    const rules = computed(() => {
      let rules = []
      rules.push(val => inventoryCategories.value.filter(cate => cate === val).length <= 1 || '')
      return rules
    })

    watch(internalValue, async (val) => {
      if (val) {
        addedCategory.value = []
      }
    })

    const addCategory = function () {
      addedCategory.value.unshift({
        name: '',
        available: true
      })
    }
    const removeCategory = async function (category) {
      if (!category.available) return
      if(category._id) await deleteInventoryCategory(category._id)
    }
    const complete = async function () {
      const mergedInventories = [...addedCategory.value, ...inventoryCategories.value]
      if(_.some(_.countBy(mergedInventories, 'name'), cate => cate > 1)) {
        return
      }
      await updateInventoryCategories(mergedInventories)
      internalValue.value = false
    }

    return () => <>
      <g-dialog fullscreen v-model={internalValue.value} content-class="dialog-inventory-category">
        {genScopeId(() => (
            <div class="dialog">
              <div class={showKeyboard.value ? 'dialog-left' : 'dialog-center'}>
                <div class="category">
                  {[...addedCategory.value, ...inventoryCategories.value].map((category, i) =>
                      <div class="category-item" key={i}>
                        <g-text-field-bs rules={rules.value} onClick={() => showKeyboard.value = true} virtual-event v-model={category.name}></g-text-field-bs>
                        <div onClick={() => removeCategory(category, i)} class={['category-item__btn', category.available && 'category-item__btn--delete']}>
                          <g-icon>icon-delete2</g-icon>
                        </div>
                      </div>
                  )} </div>
                <p>* {t('inventory.onlyEmpty')}</p>
                <div class="dialog-action">
                  <g-btn-bs icon="add" background-color="#1271FF" onClick={addCategory}>{t('article.category')}</g-btn-bs>
                  <g-btn-bs background-color="#388E3C" onClick={complete}>{t('inventory.complete')}</g-btn-bs>
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
