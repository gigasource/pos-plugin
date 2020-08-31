<template>
  <div v-show="internalValue" class="wrapper col-flex">
    <div class="header">
      <g-btn flat background-color="#1271ff" text-color="#fff">New</g-btn>
      <template v-for="group in modifierGroups">
        <g-btn outlined :uppercase="false" :background-color="activeGroup === group ? '#E3F2FD' : '#F0F0F0'"
               @click="setActiveGroup(group)" :key="group._id">{{group.name}}</g-btn>
      </template>
    </div>
    <div class="content row-flex">
      <div class="content--main col-flex align-items-start">
        <template v-for="category in categories">
          <g-btn flat :uppercase="false" @click="setActiveCategory(category)">{{category.name}}</g-btn>
          <div>
            <span> > </span>
            <g-btn flat v-for="mod in modifiers[category._id]" :uppercase="false"
                   @click="setActiveModifier(mod)">{{mod.name}}</g-btn>
          </div>
        </template>
        <g-btn flat background-color="#1271ff" text-color="#fff">New Category</g-btn>
      </div>
      <div class="content--sidebar col-flex">
        <div class="pa-2">
          <template v-if="activeEditItem && activeEditItem.type === 'group'">
            <pos-text-field label="Name" v-model="activeEditItem.name"/>
            <g-switch label="Global modifier" v-model="activeEditItem.isGlobal"/>
            <div class="fs-small-2 i">
              <span class="fw-700">Note: </span>
              <span>Global modifiers can be selected in all dishes.</span>
            </div>
          </template>

          <!-- Category -->
          <template v-if="activeEditItem && activeEditItem.type === 'category'">
            <g-switch label="Global modifier" v-model="activeEditItem.mandatory"/>
            <g-switch label="Select one only" v-model="activeEditItem.selectOne"/>
            <pos-text-field label="Name" v-model="activeEditItem.name"/>
            <pos-text-field label="No. of free items" v-model="activeEditItem.freeItems"/>
          </template>

          <!-- Modifier -->
          <template v-if="activeEditItem && activeEditItem.type === 'modifier'">
            <pos-text-field label="Name" v-model="activeEditItem.name"/>
            <pos-text-field label="Price" v-model="activeEditItem.price"/>
            <pos-text-field label="Max items" v-model="activeEditItem.max"/>
            <div>
              <div style="font-size: 13px; margin: 12px 4px 2px 4px;">Group printer</div>
              <g-grid-select v-model="activeEditItem.printer" item-text="name" item-value="_id" :items="groupPrinters" itemCols="auto">
                <template #default="{ toggleSelect, item, index }">
                  <div class="prop-option" @click="e => { toggleSelect(item) }">{{item.name}}</div>
                </template>
                <template #selected="{ toggleSelect, item, index }">
                  <div class="prop-option prop-option--active" @click="e => { toggleSelect(item) } ">{{item.name}}</div>
                </template>
              </g-grid-select>
            </div>
          </template>
        </div>
        <!-- Group -->


        <div class="row-flex flex-grow-1 align-items-end">
          <g-btn flat background-color="#ff4452" text-color="#fff" border-radius="0"
                 @click="close" style="flex: 1; margin: 0">Close</g-btn>
          <g-btn flat background-color="#2979FF" text-color="#fff" border-radius="0"
                 @click="save" style="flex: 1; margin: 0">Save</g-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import PosTextField from '../pos-shared-components/POSInput/PosTextField';
  export default {
    name: 'dialogEditPopupModifiers',
    components: { PosTextField },
    props: {
      value: Boolean,
      product: null
    },
    data() {
      return {
        activeGroup: null,
        activeCategory: null,
        activeModifier: null,
        activeEditItem: null,
        groupPrinters: [],
        modifierGroups: [],
        categories: [],
        newCategories: [],
        modifiers: {}
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value)
        }
      },
      allCategories() {
        return [...this.categories, ...this.newCategories]
      }
    },
    methods: {
      async getModifierGroups() {
        return await cms.getModel('PosModifierGroup').find()
      },
      async getCategories(group) {
        const filter = { modifierGroup: group._id }
        if (!group.isGlobal) filter.product = this.product._id
        return await cms.getModel('PosModifierCategory').find(filter).lean()
      },
      async getModifiers(group) {
        const filter = { modifierGroup: group._id }
        if (!group.isGlobal) filter.product = this.product._id
        const modifiers = await cms.getModel('PosPopupModifier').find(filter).lean()
        console.log('modifiers', modifiers)
        return _.groupBy(modifiers, 'category')
      },
      async getGroupPrinters() {
        return await cms.getModel('GroupPrinter').find()
      },
      addCategory() {
        const newCategory = {
          name: 'New Category'
        }
      },
      setActiveGroup(group) {
        console.log('active group', group)
        this.activeGroup = group
        this.activeEditItem = {...group, type: 'group'}
      },
      setActiveCategory(category) {
        this.activeCategory = category
        this.activeEditItem = {...category, type: 'category'}
      },
      setActiveModifier(modifier) {
        this.activeModifier = modifier
        this.activeEditItem = {...modifier, type: 'modifier'}
      },
      async save() {
        const type = this.activeEditItem.type
        const item = _.omit({...this.activeEditItem}, 'type')

        switch (type) {
          case 'group':
            await cms.getModel('PosModifierGroup').findOneAndUpdate({ _id: item._id }, item)
            break
          case 'category':
            await cms.getModel('PosModifierCategory').findOneAndUpdate({ _id: item._id }, item)
            break
          case 'modifier':
            await cms.getModel('PosPopupModifier').findOneAndUpdate({ _id: item._id }, item)
            break
          default:
            return;
        }

        this.modifierGroups = await this.getModifierGroups()
        this.activeGroup = this.modifierGroups.find(g => g._id === this.activeGroup._id)
      },
      close() {
        this.internalValue = false
      }
    },
    async created() {
      this.modifierGroups = await this.getModifierGroups()
      this.groupPrinters = await this.getGroupPrinters()
    },
    watch: {
      async activeGroup(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.categories = await this.getCategories(newVal)
          this.modifiers = await this.getModifiers(newVal)
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .wrapper {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 999999;
    background: #fff;
  }

  .header {
    border-bottom: 1px solid #979797;
    padding: 16px;
  }

  .content {
    flex: 1;

    &--main {
      flex-grow: 1;
      padding: 16px;
    }

    &--sidebar {
      border-left: 0.5px solid #979797;
      width: 25%;
    }
  }

  .g-btn {
    margin-right: 16px;
    margin-bottom: 8px;
    border: 1px solid #D0D0D0;
    border-radius: 2px;
    font-weight: bold;
  }

  .prop-option {
    display: inline-block;
    padding: 0 6px;
    margin-right: 4px;
    cursor: pointer;
    border: 1px solid #E0E0E0;
    box-sizing: border-box;
    border-radius: 2px;
    font-size: 13px;

    &--active {
      background: #E3F2FD;
      border: 1px solid #90CAF9;
    }
  }
</style>
