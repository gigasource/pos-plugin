<script>
import { useI18n } from 'vue-i18n';
import { genScopeId, internalValueFactory } from '../../utils'
import { computed } from 'vue';

export default {
  setup(props, { emit }) {
    const product = props.product
    const internalValue = internalValueFactory(props, { emit })

    const { t, locale } = useI18n()
    const activeModifierGroup = ref(null)
    const categories = ref([])
    const modifiers = ref([])
    const gGridSelectModifierModel = ref({})
    const selectingModifiers = ref([])
    const listModifiers = computed(() => {
      let list = []
      const modifiersByCategories = _.groupBy(selectingModifiers.value, 'category')
      _.forEach(modifiersByCategories, (mods, catId) => {
        const { freeItems } = categories.value.find(c => c._id === catId)

        const sortedModsByPrice = mods.sort((cur, next) => next.price - cur.price)

        let indexOffset = 0
        const modsWithFreeItems = sortedModsByPrice.map((item, index) => {
          if (item.price === 0 || index >= freeItems + indexOffset) {
            if (index < freeItems + indexOffset) indexOffset += 1
            return item
          }

          return {
            ...item,
            price: 0
          }
        })
        list = list.concat(...modsWithFreeItems)
      })
      return list
    })

    const enableSaveBtn = computed(() => {
      const mandatoryCategories = categories.value.filter(cat => cat.mandatory)
      return _.every(mandatoryCategories, cat => {
        if (cat.selectOne)
          return !!gGridSelectModifierModel.value[cat._id]
        return gGridSelectModifierModel[cat._id] && gGridSelectModifierModel[cat._id].length > 0
      })
    })

    const save = function () {
      emit('save', product, listModifiers.value)
      internalValue.value = false
    }

    const selectModifierGroup = function (group) {
      activeModifierGroup.value = group
    }
    const onClickModifier = function (modifier, category, toggleSelect) {
      // if modifier was not added then add it and return immediately
      if (!selectingModifiers.value.some(mod => mod._id === modifier._id)) {
        // wipe out another modifier in the same category
        if (category.selectOne)
          selectingModifiers.value = selectingModifiers.value.filter(m => m.category !== category._id)
        selectingModifiers.push(modifier)
        toggleSelect(modifier)
        return
      }

      // otherwise, check if quantity of current modifier is > max
      const qty = selectingModifiers.value.filter(mod => mod._id === modifier._id).length;
      const qtyAllowed = modifier.max || 1

      // if not exceed maximum, then add (don't toggle to keep selected state)
      if (qty < qtyAllowed) {
        selectingModifiers.value.push(modifier)
        return
      }

      // maximum exceed, if category is not mandatory then wipe out current modifier from selecting list
      if (!category.mandatory) {
        selectingModifiers.value = selectingModifiers.value.filter(mod => mod._id !== modifier._id)
        toggleSelect(modifier)
        return
      }

      // modifier is mandatory (we need select at least 1 item)
      // so we can only wipe out current modifier if we also
      // select another modifier in the same category
      // (to keep GUI consistence for g-grid-select)
      if (!category.selectOne && gGridSelectModifierModel.value[category._id].length > 1) {
        selectingModifiers.value = selectingModifiers.value.filter(mod => mod._id !== modifier._id)
      }

      toggleSelect(modifier)
    }
    const selectModifier = function (value, category) {
      gGridSelectModifierModel.value[category._id] = value
    }
    const getModifierQty = function (_id) {
      return selectingModifiers.value.filter(mod => mod._id === _id).length;
    }

    return genScopeId(() => <g-dialog v-model={internalValue} width="60%">
      <g-card class="pt-3 pr-4 pb-3 pl-4">
        <g-card-title>
          <div class="row-flex flex-grow-1">
            <div class="flex-grow-1">{product.name}</div>
            <g-icon
                onClick={() => internalValue.value = false}>icon-close
            </g-icon>
          </div>
        </g-card-title>
        <g-card-text>
          {categories.value.map((category, cIndex) =>
              <>
                <div>
                  <span>{category.name}</span>
                  {category.mandatory && <span style="color: #FF4452;">*</span>}
                </div>
                <div class="mt-2 mb-3">
                  <g-grid-select
                      items={modifiers.value[category._id]}
                      grid={false}
                      return-object={true}
                      multiple={!category.selectOne}
                      mandatory={category.mandatory}
                      modelValue={gGridSelectModifierModel.value[category._id]}
                      onUpdate:modelValue={(newV) => selectModifier(newV, category)}>
                    {{
                      default: (toggleSelect, item, index) =>
                          <g-btn uppercase={false} border-radius="2" outlined={true} class="mr-3 mb-2" background-color="#F0F0F0"
                                 style="border: 1px solid #C9C9C9" key={`${cIndex}_${index}`}
                                 onClick={() => onClickModifier(item, category, toggleSelect)}>
                            {item.name} - {t('common.currency', locale.value)}{item.price}
                          </g-btn>,
                      selected: (toggleSelect, item, index) => <>
                        <span key={`${cIndex}_${index}_selected`}>
                          {getModifierQty(item._id) > 1 ?
                              <g-badge overlay color="#FF4452" class="mr-3 mb-2">
                                {{
                                  badge: () => <div> {getModifierQty(item._id)} </div>,
                                  default: () => <g-btn
                                      uppercase={false} border-radius="2" flat background-color="#2979FF" text-color="#fff"
                                      onClick={() => onClickModifier(item, category, toggleSelect)}>
                                    {item.name} - {t('common.currency', locale.value)}{item.price}
                                  </g-btn>
                                }}
                              </g-badge> :
                              <g-btn
                                  uppercase={false} border-radius="2" flat class="mr-3 mb-2" background-color="#2979FF" text-color="#fff"
                                  onClick={() => onClickModifier(item, category, toggleSelect)}>
                                {item.name}
                                -
                                {t('common.currency', locale.value)}
                                {item.price}
                              </g-btn>}
                        </span>
                      </>
                    }}
                  </g-grid-select>
                </div>
              </>)}
        </g-card-text>
        <g-card-actions>
          <g-btn background-color="#2979FF" text-color="#fff"
                 onClick={save} disabled={!enableSaveBtn.value}>Save
          </g-btn>
        </g-card-actions>
      </g-card>
    </g-dialog>)
  }
}
</script>

<style scoped lang="scss">
.modifier-group {
  cursor: pointer;
  font-size: 16px;

  &__active {
    font-weight: bold;
  }
}

.modifier {

  &__active {

  }
}
</style>
