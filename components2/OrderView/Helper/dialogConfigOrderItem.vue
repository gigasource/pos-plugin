<script>
import {useI18n} from 'vue-i18n';
import {computed, ref, watch} from 'vue';
import {getCurrentOrder} from "../pos-logic-be";
import {addItemModifier, addModifier, makeDiscount, makeItemDiscount} from "../pos-logic";
import DiscountInput2 from "../../Payment/Helpers/DiscountInput2";
import {getScopeAttrs} from "../../../utils/helpers";
import {genScopeId} from "../../utils";
import Hooks from "schemahandler/hooks/hooks";
import {fetchModifiers, modifierGroups} from "../../Modifiers/dialogEditPopupModifier/modifier-ui-logics";
import dialogChoosePopupModifier from "../../Modifiers/dialogChoosePopupModifier/dialogChoosePopupModifier";

export default {
  name: 'DialogConfigOrderItem',
  props: {
    modelValue: null,
    product: null
  },
  components: {DiscountInput2, dialogChoosePopupModifier},
  setup(props, {emit}) {
    const {t: $t, locale} = useI18n()
    const hooks = new Hooks();
    const tab = ref(null)
    const tabItems = ref([
      {title: $t('restaurant.modifier'), event: 'addModifier'},
      {title: $t('common.discount'), event: 'changePrice'}
    ])
    const selectedModifiers = ref({})
    const listModifiers = ref([])
    // add modifier
    const modifier = ref('')
    const price = ref('')
    const rules = ref([
      val => !isNaN(val) || $t('ui.numberRulesErr')
    ])
    const order = getCurrentOrder();

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
    fetchModifiers();
    const tabs = computed(() => {
      const mods = modifierGroups.value.groups.map(group => {
        const {name, categories, modifiers} = group
        const modifiersByCategory = _.groupBy(modifiers, 'category')

        return ({
          title: name,
          categories,
          modifiersByCategory,
          event: 'addModifier',
          //todo
          isGlobalMod: true
        });
      });
      return [...tabItems.value, ...mods]
    })
    const existingModifiers = computed(() => {
      if (!props.product || !props.product.modifiers) return {}
      const modifiersByCategory = _.groupBy(props.product.modifiers.filter(mod => mod.modifierGroup), 'category')
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

    const submit = function ({type, value}) {
      if (tab.value) {
        if (listModifiersWithFreeItems.value.length) {
          listModifiersWithFreeItems.value.forEach(mod => emit('addModifier', mod))
          return dialogConfigOrderItem.value = false
        }

        if (tab.value.event === 'addModifier') {
          addModifier(order, {name: modifier.value, price: price.value || 0});
        } else if (tab.value.event === 'changePrice') {
          if (type === 'percentage') {
            makeItemDiscount(order, props.product, value + '%');
          } else {
            makeItemDiscount(order, props.product, value + '');
          }
        }
        dialogConfigOrderItem.value = false;
      }
    }

    function submitModifiers(product, modifiers) {
      for (const modifier of modifiers) {
        addItemModifier(order, props.product, modifier);
      }
      dialogConfigOrderItem.value = false;
    }

    let discountInputRef = ref();

    watch([() => dialogConfigOrderItem.value, () => discountInputRef.value], () => {
      if (dialogConfigOrderItem.value && discountInputRef.value) {
        if (_.includes(props.product.discount, '%')) {
          hooks.emit('init', parseFloat(props.product.discount.split('%')[0]));
        } else {
          hooks.emit('init', undefined, parseFloat(props.product.discount));
        }
      }
    })

    return () =>
        <g-dialog v-model={dialogConfigOrderItem.value} width="90%" onSubmit={submit}
                  forceDisableButtons={true}
                  showKeyboard={!tab.value || !tab.value.isGlobalMod && tab.value.event !== 'changePrice'} v-slots={{
          default: genScopeId(() =>
              <g-card>
                <g-tabs v-model={tab.value} items={tabs.value} text-color="#1d1d26" color="white"
                        active-text-color="#1d1d26"
                        slider-color="#1471ff" slider-size="3"
                        vertical>
                  {tabs.value.map((tabItem, index) =>
                      <g-tab-item key={index} item={tabItem}>
                        {(index === 0) &&
                        <div class="modifier-content row-flex flex-wrap justify-around mb-2">
                          <pos-textfield-new style="width: 48%;" v-model={modifier.value} label="Modifier"
                                             placeholder="Name"/>
                          <pos-textfield-new style="width: 48%;" rules={rules.value} v-model_number={price.value}
                                             label="Price"
                                             placeholder="Price"/>
                          <div class="keyboard w-100 mt-5">
                            <pos-keyboard-full onEnterPressed={submit}/>
                          </div>
                        </div>}

                        {(index === 1) &&
                        <discount-input2 ref={discountInputRef} onSubmit={submit} hooks={hooks}/>
                        }

                        {tabItem.isGlobalMod &&
                          <dialog-choose-popup-modifier v-model={dialogConfigOrderItem.value} embed categories={tabItem.categories} onSave={submitModifiers}/>
                        }
                      </g-tab-item>)}
                </g-tabs>
              </g-card>)
        }}/>
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

:deep .keyboard {
  background-color: #bdbdbd;
  padding: 0.5rem;
  margin: 0 -16px -16px -16px;
}

@media screen and (max-height: 599px) {
  .keyboard {
    margin: 0 -8px -8px -8px;

    :deep .key {
      font-size: 18px;
    }
  }
}

</style>
