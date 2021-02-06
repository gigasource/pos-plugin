<template>
  <dialog-form-input v-model="dialogConfigOrderItem" width="90%" @submit="submit" :show-keyboard="!tab || !tab.isGlobalMod">
    <template v-slot:input>
      <g-tabs v-model="tab" :items="tabs" text-color="#1d1d26" color="white" active-text-color="#1d1d26"
              slider-color="#1471ff" slider-size="3">
        <g-tab-item v-for="(tabItem, index) in tabs" :key="index" :item="tabItem">
          <template v-if="index === 0">
            <div class="modifier-content row-flex flex-wrap justify-around mb-2">
              <pos-textfield-new style="width: 48%;" v-model="modifier" label="Modifier" placeholder="Name"/>
              <pos-textfield-new style="width: 48%;" :rules="rules" v-model="price" label="Price" placeholder="Price"/>
            </div>
          </template>

          <template v-if="index === 1">
            <change-value v-model:change-type="changeType" :original-value="originalValue" :new-value-editable="newValueEditable"
                          v-model:new-value="newValue" />
          </template>

          <template v-if="tabItem.isGlobalMod">
            <template v-for="category in tabItem.categories">
              <div>
                <span>{{category.name}}</span>
                <span v-if="category.mandatory" style="color: #FF4452;">*</span>
              </div>
              <div class="mt-2 mb-3">
                <g-grid-select :items="tabItem.modifiersByCategory[category._id]" :grid="false" return-object
                               :multiple="!category.selectOne" :mandatory="category.mandatory"
                               :model-value="selectedModifiers[category._id]" @update:modelValue="selectModifier($event, category)"
                >
                  <template #default="{ toggleSelect, item, index }">
                    <g-btn :uppercase="false" border-radius="2" outlined class="mr-3" background-color="#F0F0F0"
                           style="border: 1px solid #C9C9C9"
                           @click="onClickModifier(item, category, toggleSelect)">
                      <span class="fw-700">{{item.name}} - {{$t('common.currency', storeLocale)}}{{item.price}}</span>
                    </g-btn>

                  </template>
                  <template #selected="{ toggleSelect, item, index }">

                    <g-badge v-if="getModifierQty(item._id) > 1" overlay color="#FF4452" class="mr-3">
                      <template #badge>
                        <div>{{getModifierQty(item._id)}}</div>
                      </template>
                      <g-btn :uppercase="false" border-radius="2" flat background-color="#2979FF" text-color="#fff"
                             @click="onClickModifier(item, category, toggleSelect)">
                        <span class="fw-700">{{item.name}} - {{$t('common.currency', storeLocale)}}{{item.price}}</span>
                      </g-btn>
                    </g-badge>

                    <g-btn v-else :uppercase="false" border-radius="2" flat class="mr-3" background-color="#2979FF" text-color="#fff"
                           @click="onClickModifier(item, category, toggleSelect)">
                      <span class="fw-700">{{item.name}} - {{$t('common.currency', storeLocale)}}{{item.price}}</span>
                    </g-btn>

                  </template>
                </g-grid-select>
              </div>
            </template>
          </template>
        </g-tab-item>
      </g-tabs>
    </template>
  </dialog-form-input>
</template>

<script>
  import ChangeValue from '../../components2/pos-shared-components/ChangeValue';
  import PosTextfieldNew from '../../components2/pos-shared-components/POSInput/PosTextfieldNew';

  export default {
    name: "dialogConfigOrderItem",
    injectService: ['PosStore:storeLocale'],
    components: { PosTextfieldNew, ChangeValue },
    props: {
      modelValue: null,
      product: null,
      originalValue: Number
    },
    data() {
      return {
        tab: null,
        tabItems: [
          {title: this.$t('restaurant.modifier'), event: 'addModifier'},
          {title: this.$t('common.discount'), event: 'changePrice'}
        ],
        modifierGroups: [],
        selectedModifiers: {},
        listModifiers: [],
        // add modifier
        modifier: '',
        price: '',
        rules: [
          val => !isNaN(val) || this.$t('ui.numberRulesErr')
        ],

        // discount
        newValueEditable: true,
        changeType: 'percentage',
        newValue: 0
      }
    },
    emits: ['update:modelValue', 'addModifier', 'changePrice'],
    computed: {
      dialogConfigOrderItem: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.modifier = ''
          this.price = ''
          this.$emit('update:modelValue', val)
        }
      },
      tabs() {
        const mods = this.modifierGroups.map(group => {
          const { name, categories, modifiers } = group
          const modifiersByCategory = _.groupBy(modifiers, 'category')

          return ({
            title: name,
            categories,
            modifiersByCategory,
            event: 'addModifier',
            isGlobalMod: true
          });
        });
        return [...this.tabItems, ...mods]
      },
      existingModifiers() {
        if (!this.product || !this.product.modifiers) return {}
        const modifiersByCategory = _.groupBy(this.product.modifiers.filter(mod => mod.modifierGroup), 'category')
        console.log(modifiersByCategory)
        return _.mapValues(modifiersByCategory, item => item.length)
      },
      listModifiersWithFreeItems() {
        let list = []
        const modifiersByCategories = _.groupBy(this.listModifiers, 'category')

        _.forEach(modifiersByCategories, (mods, catId) => {
          const { freeItems } = this.tab.categories.find(c => c._id === catId)

          const sortedModsByPrice = mods.sort((cur, next) => next.price - cur.price)

          let indexOffset = 0
          if (this.existingModifiers[catId]) indexOffset -= this.existingModifiers[catId]
          console.log('indexOffset', indexOffset)
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

        console.log('list prices', JSON.stringify(list.map(m => m.price)))
        return list
      },
  },
    methods: {
      addModifier() {
        if (!this.price) this.price = 0
        if (this.modifier && !isNaN(this.price) && this.price >=0)
          this.$emit('addModifier', {name: this.modifier, price: +this.price})
        this.dialogConfigOrderItem = false
      },
      changePrice() {
        this.$emit('changePrice', this.newValue)
        this.dialogConfigOrderItem = false
      },
      selectModifier(value, category) {
        this.selectedModifiers[category._id] = value
      },
      onClickModifier(modifier, category, select) {
        // not selected
        if (!this.listModifiers.some(mod => mod._id === modifier._id)) {
          this.listModifiers.push(modifier)
          return select(modifier)
        }

        const length = this.listModifiers.filter(mod => mod._id === modifier._id).length;
        if (length >= 1) {
          const maxItems = modifier.max || 1
          // selected, at max qty
          if (length >= maxItems) {
            if (category.mandatory) {
              if (!category.selectOne && this.selectedModifiers[category._id].length > 1) {
                this.listModifiers = this.listModifiers.filter(mod => mod._id !== modifier._id)
              }
            } else {
              this.listModifiers = this.listModifiers.filter(mod => mod._id !== modifier._id)
            }
            return select(modifier)
          }
          // selected, can add more
          return this.listModifiers.push(modifier)
        }
      },
      getModifierQty(_id) {
        return this.listModifiers.filter(mod => mod._id === _id).length;
      },
      submit() {
        if (this.tab) {
          if (this.listModifiersWithFreeItems.length) {
            this.listModifiersWithFreeItems.forEach(mod => this.$emit('addModifier', mod))
            return this.dialogConfigOrderItem = false
          }

          this[this.tab.event]()
        }
      }
    },
    async created() {
      const modifierGroups = await cms.getModel('PosModifierGroup').find()
      for (const group of modifierGroups) {
        const categories = await cms.getModel('PosModifierCategory').find({ modifierGroup: group._id })
        const modifiers = await cms.getModel('PosPopupModifier').find({ modifierGroup: group._id })
        group.categories = categories
        group.modifiers = modifiers
      }
      this.modifierGroups = modifierGroups.filter(g => g.modifiers.length > 0)
    },
    watch: {
      tab(val) {
        if (val) {
          if (val.isGlobalMod) {
            this.selectedModifiers = {}
            this.listModifiers = []
            const { categories } = val
            categories.forEach(cat => {
              if (!cat.selectOne)
                this.selectedModifiers[cat._id] = []
            })
          }
        }
      },
      async dialogConfigOrderItem(val) {
        if (val) {
          const modifierGroups = await cms.getModel('PosModifierGroup').find()
          for (const group of modifierGroups) {
            const categories = await cms.getModel('PosModifierCategory').find({ modifierGroup: group._id })
            const modifiers = await cms.getModel('PosPopupModifier').find({ modifierGroup: group._id })
            group.categories = categories
            group.modifiers = modifiers
          }
          this.modifierGroups = modifierGroups.filter(g => g.modifiers.length > 0)

          this.selectedModifiers = {}
          this.listModifiers = []
          this.tab = this.tabs && this.tabs[0]
        }
      }
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
