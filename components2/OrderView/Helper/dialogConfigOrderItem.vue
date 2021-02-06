<script>
import {useI18n} from 'vue-i18n';
import {computed, ref} from 'vue';

export default {
  props: {
    modelValue: null,
    product: null,
    originalValue: Number
  },
  setup(props, {emit}) {
    const {t: $t, locale} = useI18n()
    const product = props.product
    const originalValue = props.originalValue
    const tab = ref(null)
    const tabItems = ref([
      {title: $t('restaurant.modifier'), event: 'addModifier'},
      {title: $t('common.discount'), event: 'changePrice'}
    ])
    const modifierGroups = ref([])
    const selectedModifiers = ref({})
    const listModifiers = ref([])
    // add modifier
    const modifier = ref('')
    const price = ref('')
    const rules = ref([
      val => !isNaN(val) || $t('ui.numberRulesErr')
    ])

    // discount
    const newValueEditable = ref(true)
    const changeType = ref('percentage')
    const newValue = ref(0)
    const dialogConfigOrderItem = computed({
      get: () => {
        return props.modelValue
      },
      set: (val) => {
        modifier.value = ''
        price.value = ''
        emit('update:modelValue', val)
      }
    })
    const tabs = computed(() => {
      const mods = modifierGroups.value.map(group => {
        const {name, categories, modifiers} = group
        const modifiersByCategory = _.groupBy(modifiers, 'category')

        return ({
          title: name,
          categories,
          modifiersByCategory,
          event: 'addModifier',
          isGlobalMod: true
        });
      });
      return [...tabItems, ...mods]
    })
    const existingModifiers = computed(() => {
      if (!product || !product.modifiers) return {}
      const modifiersByCategory = _.groupBy(product.modifiers.filter(mod => mod.modifierGroup), 'category')
      return _.mapValues(modifiersByCategory, item => item.length)
    })
    const listModifiersWithFreeItems = computed(() => {
      let list = []
      const modifiersByCategories = _.groupBy(listModifiers.value, 'category')

      _.forEach(modifiersByCategories, (mods, catId) => {
        const {freeItems} = tab.value.categories.find(c => c._id === catId)

        const sortedModsByPrice = mods.sort((cur, next) => next.price - cur.price)

        let indexOffset = 0
        if (existingModifiers.value[catId]) indexOffset -= existingModifiers.value[catId]
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
    const addModifier = function () {
      if (!price.value) price.value = 0
      if (modifier.value && !isNaN(price.value) && price.value >= 0)
        emit('addModifier', {name: modifier.value, price: +price.value})
      dialogConfigOrderItem.value = false
    }
    const changePrice = function () {
      emit('changePrice', newValue.value)
      dialogConfigOrderItem.value = false
    }
    const selectModifier = function (value, category) {
      selectedModifiers.value[category._id] = value
    }

    const onClickModifier = function (modifier, category, select) {
      // not selected
      if (!listModifiers.value.some(mod => mod._id === modifier._id)) {
        listModifiers.value.push(modifier)
        return select(modifier)
      }

      const length = listModifiers.value.filter(mod => mod._id === modifier._id).length;
      if (length >= 1) {
        const maxItems = modifier.max || 1
        // selected, at max qty
        if (length >= maxItems) {
          if (category.mandatory) {
            if (!category.selectOne && selectedModifiers.value[category._id].length > 1) {
              listModifiers.value = listModifiers.value.filter(mod => mod._id !== modifier._id)
            }
          } else {
            listModifiers.value = listModifiers.value.filter(mod => mod._id !== modifier._id)
          }
          return select(modifier)
        }
        // selected, can add more
        return listModifiers.value.push(modifier)
      }
    }

    const getModifierQty = function (_id) {
      return listModifiers.value.filter(mod => mod._id === _id).length;
    }

    const submit = function () {
      if (tab) {
        if (listModifiersWithFreeItems.value.length) {
          listModifiersWithFreeItems.value.forEach(mod => emit('addModifier', mod))
          return dialogConfigOrderItem.value = false
        }

        tab.value.event()
      }
    }
    return () =>
        <dialog-form-input v-model={dialogConfigOrderItem.value} width="90%" onSubmit={submit}
                           showKeyboard={!tab.value || !tab.value.isGlobalMod}>
          {{
            input: () =>
                <g-tabs v-model={tab.value} items={tabs.value} text-color="#1d1d26" color="white"
                        active-text-color="#1d1d26"
                        slider-color="#1471ff" slider-size="3">
                  {tabs.value.map((tabItem, index) =>
                      <g-tab-item key={index} item={tabItem}>
                        {(index === 0) &&
                        <div class="modifier-content row-flex flex-wrap justify-around mb-2">
                          <pos-textfield-new style="width: 48%;" v-model={modifier} label="Modifier"
                                             placeholder="Name"/>
                          <pos-textfield-new style="width: 48%;" rules={rules} v-model={price} label="Price"
                                             placeholder="Price"/>
                        </div>}

                        {(index === 1) &&
                        <change-value v-model={changeType.value} originalValue={originalValue}
                                      newValueEditable={newValueEditable.value}
                                      v-model={newValue.value}/>
                        }

                        {tabItem.isGlobalMod && <>
                          {tabItem.categories.map(category =>
                              <>
                                <div>
                                  <span>{category.name}</span>
                                  {category.mandatory && <span style="color: #FF4452;">*</span>}
                                </div>
                                <div class="mt-2 mb-3">
                                  <g-grid-select items={tabItem.modifiersByCategory[category._id]} grid={false}
                                                 return-object
                                                 multiple={!category.selectOne} mandatory={category.mandatory}
                                                 modelValue={selectedModifiers[category._id]}
                                                 onUpdate:modelValue={(newV) => selectModifier(newV, category)}
                                  >
                                    {{
                                      default: ({toggleSelect, item, index}) =>
                                          <g-btn uppercase={false} border-radius="2" outlined class="mr-3"
                                                 background-color="#F0F0F0"
                                                 style="border: 1px solid #C9C9C9"
                                                 onClick={() => onClickModifier(item, category, toggleSelect)}>
                                            <span
                                                class="fw-700">{item.name} - {$t('common.currency', locale.value)}{item.price}</span>
                                          </g-btn>,
                                      selected: ({toggleSelect, item, index}) => <>
                                        {(getModifierQty(item._id) > 1) ?
                                            <g-badge overlay color="#FF4452" class="mr-3">
                                              {{
                                                badge: () => <div>{getModifierQty(item._id)}</div>,
                                                default: () =>
                                                    <g-btn uppercase={false} border-radius="2" flat
                                                           background-color="#2979FF" text-color="#fff"
                                                           onClick={onClickModifier(item, category, toggleSelect)}>
                                                      <span
                                                          class="fw-700">{item.name} - {$t('common.currency', locale.value)}{item.price}</span>
                                                    </g-btn>
                                              }}
                                            </g-badge> :
                                            <g-btn uppercase={false} border-radius="2" flat class="mr-3"
                                                   background-color="#2979FF" text-color="#fff"
                                                   onClick={onClickModifier(item, category, toggleSelect)}>
                                              <span
                                                  class="fw-700">{item.name} - {$t('common.currency', locale.value)}{item.price}</span>
                                            </g-btn>}
                                      </>
                                    }}
                                  </g-grid-select>
                                </div>
                              </>)}
                        </>}
                      </g-tab-item>)}
                </g-tabs>
          }}
        </dialog-form-input>
  }
}
</script>

<style scoped lang="scss">
.modifier-content {
  margin-top: 8px;

  ::v-deep .bs-tf-label {
    font-size: 16px;
  }
}
</style>
