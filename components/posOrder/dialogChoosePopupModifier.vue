<template>
  <g-dialog v-model="internalValue" width="60%">
    <g-card class="pt-3 pr-4 pb-3 pl-4">
      <g-card-title>
        <div class="row-flex flex-grow-1">
          <div class="flex-grow-1">{{product.name}}</div>
          <g-icon @click="internalValue = false">icon-close</g-icon>
        </div>
      </g-card-title>
      <g-card-text>
        <template v-for="(category, cIndex) in categories">
          <div>
            <span>{{category.name}}</span>
            <span v-if="category.mandatory" style="color: #FF4452;">*</span>
          </div>
          <div class="mt-2 mb-3">
            <g-grid-select :items="modifiers[category._id]" :grid="false" return-object
                           :multiple="!category.selectOne" :mandatory="category.mandatory"
                           :model-value="selectedModifiers[category._id]"
                           @update:modelValue="selectModifier($event, category)">
              <template #default="{ toggleSelect, item, index }">
                <g-btn :uppercase="false" border-radius="2" outlined class="mr-3 mb-2" background-color="#F0F0F0"
                       style="border: 1px solid #C9C9C9"
                       :key="`${cIndex}_${index}`"
                       @click="onClickModifier(item, category, toggleSelect)">
                  {{item.name}} - {{$t('common.currency', storeLocale)}}{{item.price}}
                </g-btn>
              </template>
              
              <template #selected="{ toggleSelect, item, index }">
                <span :key="`${cIndex}_${index}_selected`">
                  <g-badge v-if="getModifierQty(item._id) > 1" overlay color="#FF4452" class="mr-3 mb-2">
                    <template #badge>
                      <div>{{getModifierQty(item._id)}}</div>
                    </template>
                    <g-btn :uppercase="false" border-radius="2" flat background-color="#2979FF" text-color="#fff"
                           @click="onClickModifier(item, category, toggleSelect)">
                      {{item.name}} - {{$t('common.currency', storeLocale)}}{{item.price}}
                    </g-btn>
                  </g-badge>
                  <g-btn v-else :uppercase="false" border-radius="2" flat class="mr-3 mb-2" background-color="#2979FF" text-color="#fff"
                         @click="onClickModifier(item, category, toggleSelect)">
                    {{item.name}} - {{$t('common.currency', storeLocale)}}{{item.price}}
                  </g-btn>
                </span>
              </template>
            </g-grid-select>
          </div>
        </template>
      </g-card-text>
      <g-card-actions>
        <g-btn background-color="#2979FF" text-color="#fff" @click="save" :disabled="!enableSaveBtn">Save</g-btn>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogChoosePopupModifier',
    injectService: ['PosStore:storeLocale'],
    props: {
      modelValue: Boolean,
      product: null,
    },
    data() {
      return {
        modifierGroups: [],
        activeModifierGroup: null,
        categories: [],
        modifiers: [],
        selectedModifiers: {},
        listModifiers2: []
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      listModifiers() {
        let list = []
        const modifiersByCategories = _.groupBy(this.listModifiers2, 'category')

        _.forEach(modifiersByCategories, (mods, catId) => {
          const { freeItems } = this.categories.find(c => c._id === catId)

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

        console.log('list prices', JSON.stringify(list.map(m => m.price)))
        return list
      },
      enableSaveBtn() {
        const mandatoryCategories = this.categories.filter(cat => cat.mandatory)
        return _.every(mandatoryCategories, cat => {
          if (cat.selectOne)
            return !!this.selectedModifiers[cat._id]
          return this.selectedModifiers[cat._id] && this.selectedModifiers[cat._id].length > 0
        })
      }
    },
    methods: {
      save() {
        this.$emit('save', this.product, this.listModifiers)
        this.internalValue = false
      },
      selectModifierGroup(group) {
        this.activeModifierGroup = group
      },
      onClickModifier(modifier, category, select) {
        // not selected
        if (!this.listModifiers2.some(mod => mod._id === modifier._id)) {
          if (category.selectOne) {
            this.listModifiers2 = [modifier]
          } else {
            this.listModifiers2.push(modifier)
          }

          return select(modifier)
        }

        const length = this.listModifiers2.filter(mod => mod._id === modifier._id).length;
        if (length >= 1) {
          const maxItems = modifier.max || 1
          // selected, at max qty
          if (length >= maxItems) {
            if (category.mandatory) {
              if (!category.selectOne && this.selectedModifiers[category._id].length > 1) {
                this.listModifiers2 = this.listModifiers2.filter(mod => mod._id !== modifier._id)
              }
            } else {
              this.listModifiers2 = this.listModifiers2.filter(mod => mod._id !== modifier._id)
            }
            return select(modifier)
          }
          // selected, can add more
          return this.listModifiers2.push(modifier)
        }
      },
      selectModifier(value, category) {
        this.selectedModifiers[category._id] = value
      },
      getModifierQty(_id) {
        return this.listModifiers2.filter(mod => mod._id === _id).length;
      }
    },
    watch: {
      product: {
        async handler(val) {
          if (val) {
            if (!this.product.activePopupModifierGroup) return
            this.modifierGroups = await cms.getModel('PosModifierGroup').find({ _id: this.product.activePopupModifierGroup })
            this.selectModifierGroup(this.modifierGroups[0])
          }
        },
        immediate: true
      },
      activeModifierGroup: {
        async handler(val) {
          if (!val || !this.product._id) return
          const filter = { modifierGroup: val._id }
          this.categories = await cms.getModel('PosModifierCategory').find(filter).lean()
          const modifiers = await cms.getModel('PosPopupModifier').find(filter).lean()
          this.modifiers = _.groupBy(modifiers, 'category')
          this.selectedModifiers = {}
          this.listModifiers2 = []
          this.categories.forEach(cat => {
            if (!cat.selectOne) this.selectedModifiers[cat._id] = []
          })
        }
      },
      internalValue(val) {
        if (!val) return this.selectModifierGroup({})
        this.selectedModifiers = {}
        this.listModifiers2 = []
        this.selectModifierGroup(this.modifierGroups[0])
      }
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
