<template>
  <div v-if="internalValue" class="wrapper col-flex">
    <div class="header">
      <template v-for="group in allGroups">
        <g-btn outlined :uppercase="false" background-color="#F0F0F0" :key="group._id"
               :class="[activeGroup === group && 'active-btn', activeEditItem && activeEditItem._id === group._id && 'edit-btn']"
               @click="setActiveGroup(group)">
          <g-icon size="12" style="margin-right: 8px;" v-if="group.isGlobal">icon-globe</g-icon>
          {{group.name}}
        </g-btn>
      </template>
      <g-btn flat background-color="#1271ff" text-color="#fff" :uppercase="false" v-show="!newGroup" @click="addGroup">
        <g-icon color="#fff" size="18" class="mr-2">add</g-icon>
        <span>Group</span>
      </g-btn>
    </div>
    <div class="content row-flex">
      <div class="content--main col-flex align-items-start">
        <template v-for="category in allCategories">
          <g-btn flat :uppercase="false" :key="category._id"
                 :class="['mb-2', activeCategory === category && 'active-btn', activeEditItem && activeEditItem._id === category._id && 'edit-btn']"
                 @click="setActiveCategory(category)">
            {{category.name}}
          </g-btn>
          <div class="mb-3">
            <g-icon>keyboard_arrow_right</g-icon>
            <template v-for="mod in modifiersByCategory[category._id]">
              <g-btn flat :uppercase="false" :key="mod._id"
                     :class="[activeModifier === mod && 'active-btn', activeEditItem && activeEditItem._id === mod._id && 'edit-btn']"
                     @click="setActiveModifier(mod)">
                {{mod.name}}
              </g-btn>
            </template>
            <g-btn flat background-color="#1271ff" text-color="#fff" :uppercase="false"
                   @click="addMod(category)" v-show="!newModifier">
              <g-icon color="#fff" size="18" class="mr-2">add</g-icon>
              <span>Item</span>
            </g-btn>
          </div>
        </template>
        <g-btn flat background-color="#1271ff" text-color="#fff" :uppercase="false"
               @click="addCategory" v-show="activeGroup && !newCategory">
          <g-icon color="#fff" size="18" class="mr-2">add</g-icon>
          <span>Category</span>
        </g-btn>
      </div>
      <div class="content--sidebar col-flex">
        <div class="pa-2 col-flex">
          <!-- Group -->
          <template v-if="activeEditItem && activeEditItem.type === 'group'">
            <pos-text-field label="Name" v-model="activeEditItem.name"/>
            <g-switch label="Global modifier" v-model="activeEditItem.isGlobal"/>
            <div class="fs-small-2 i">
              <span class="fw-700">Note: </span>
              <span>Global modifiers can be selected in all dishes.</span>
            </div>
            <g-btn :uppercase="false" flat background-color="#4FC3F7" text-color="#fff"
                   style="margin: 8px 4px 0 4px"
                   @click="duplicate" >
              <g-icon color="#fff" size="18" class="mr-2">file_copy</g-icon>
              <span>Duplicate this modifier</span>
            </g-btn>
            <g-btn :uppercase="false" flat background-color="#FF4452" text-color="#fff"
                   style="margin: 8px 4px 0 4px"
                   @click="deleteItem('group')">
              <g-icon color="#fff" size="18" class="mr-2">delete</g-icon>
              <span>Delete this modifier</span>
            </g-btn>
          </template>

          <!-- Category -->
          <template v-if="activeEditItem && activeEditItem.type === 'category'">
            <g-switch label="Mandatory" v-model="activeEditItem.mandatory"/>
            <g-switch label="Select one only" v-model="activeEditItem.selectOne"/>
            <pos-text-field label="Name" v-model="activeEditItem.name"/>
            <pos-text-field label="No. of free items" v-model="activeEditItem.freeItems"/>
            <g-btn :uppercase="false" flat background-color="#FF4452" text-color="#fff"
                   style="margin: 8px 4px 0 4px"
                   @click="deleteItem('category')">
              Delete this category
            </g-btn>
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
            <g-btn :uppercase="false" flat background-color="#FF4452" text-color="#fff"
                   style="margin: 8px 4px 0 4px"
                   @click="deleteItem('modifier')">
              Delete this item
            </g-btn>
          </template>
        </div>
        <!-- Group -->


        <div class="row-flex flex-grow-1 align-items-end">
          <g-btn flat background-color="#ff4452" text-color="#fff" border-radius="0"
                 @click="close" style="flex: 1; margin: 0">Close
          </g-btn>
<!--          <g-btn flat background-color="#2979FF" text-color="#fff" border-radius="0" v-if="activeEditItem"-->
<!--                 @click="save" style="flex: 1; margin: 0">Save-->
<!--          </g-btn>-->
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
        newCategory: null,
        newGroup: null,
        newModifier: null,
        modifiers: []
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
        if (this.newCategory) return [...this.categories, this.newCategory]
        return this.categories
      },
      allGroups() {
        if (this.newGroup) return [...this.modifierGroups, this.newGroup]
        return this.modifierGroups
      },
      modifiersByCategory() {
        const modifiers = this.newModifier ? [...this.modifiers, this.newModifier] : this.modifiers
        return _.groupBy(modifiers, 'category')
      },
    },
    methods: {
      async getModifierGroups() {
        return await cms.getModel('PosModifierGroup').find()
      },
      async getCategories(group) {
        if (!group._id) return []
        const filter = { modifierGroup: group._id }
        if (!group.isGlobal) filter.product = this.product._id
        return await cms.getModel('PosModifierCategory').find(filter).lean()
      },
      async getModifiers(group) {
        if (!group._id) return []
        const filter = { modifierGroup: group._id }
        if (!group.isGlobal) filter.product = this.product._id
        return await cms.getModel('PosPopupModifier').find(filter).lean()
      },
      async getGroupPrinters() {
        return await cms.getModel('GroupPrinter').find()
      },
      async addCategory() {
        this.newCategory = {
          name: 'New Category',
          mandatory: false,
          selectOne: false,
          modifierGroup: this.activeGroup._id,
          ...!this.activeGroup.isGlobal && { product: this.product._id }
        }
        const newItem = await this.save()
        this.setActiveCategory(newItem)
      },
      async addGroup() {
        this.newGroup = {
          name: 'New Group',
          isGlobal: false,
        }
        const newItem = await this.save()
        this.setActiveGroup(newItem)
      },
      async addMod(category) {
        this.newModifier = {
          name: 'New modifider',
          price: 0,
          category: category._id,
          modifierGroup: this.activeGroup._id,
          ...!this.activeGroup.isGlobal && { product: this.product._id }
        }
        const newItem = await this.save()
        this.setActiveModifier(newItem)
      },
      setActiveGroup(group) {
        this.activeGroup = group
        this.activeEditItem = { ...group, type: 'group' }
      },
      setActiveCategory(category) {
        this.activeCategory = category
        this.activeEditItem = { ...category, type: 'category' }
      },
      setActiveModifier(modifier) {
        this.activeModifier = modifier
        this.activeEditItem = { ...modifier, type: 'modifier' }
      },
      async reload(cb = () => null) {
        this.modifierGroups = await this.getModifierGroups()
        this.groupPrinters = await this.getGroupPrinters()
        cb()
      },
      async duplicate() {
        const newGroup = await cms.getModel('PosModifierGroup').create({
          name: `${this.activeEditItem.name} (1)`,
          isGlobal: this.activeEditItem.isGlobal,
        })

        await Promise.all(
          _.map(this.modifiersByCategory, (async (mods, catId) => {
            const { freeItems, mandatory, name, selectOne } = this.categories.find(cat => cat._id === catId)
            const newCategory = await cms.getModel('PosModifierCategory').create(
              { modifierGroup: newGroup._id, name, mandatory, selectOne, freeItems, })
            const newMods = mods.map(({ name, price, max, printer }) => ({
              modifierGroup: newGroup._id, category: newCategory._id, name, price, max, printer
            }))
            await cms.getModel('PosPopupModifier').create(newMods)
          })))

        await this.reload(() => this.setActiveGroup(this.modifierGroups.find(group => group._id === newGroup._id)))
      },
      async save() {
        const type = this.activeEditItem.type
        const item = _.omit({ ...this.activeEditItem }, 'type')
        let newItem
        switch (type) {
          case 'group':
            if (item._id) {
              newItem = await cms.getModel('PosModifierGroup').findOneAndUpdate({ _id: item._id }, item, { new: true })
              if (item.isGlobal !== this.activeGroup.isGlobal) {
                // update categories & modifiers
                const categoryIds = this.categories.map(c => c._id)
                const modifierIds = this.modifiers.map(m => m._id)
                if (item.isGlobal) {
                  const updateValue = { product: null }
                  await cms.getModel('PosModifierCategory').updateMany({ _id: { $in: categoryIds } }, updateValue)
                  await cms.getModel('PosPopupModifier').updateMany({ _id: { $in: modifierIds } }, updateValue)
                } else {
                  const updateValue = { product: this.product._id }
                  await cms.getModel('PosModifierCategory').updateMany({ _id: { $in: categoryIds } }, updateValue)
                  await cms.getModel('PosPopupModifier').updateMany({ _id: { $in: modifierIds } }, updateValue)
                }
              }
            } else {
              newItem = await cms.getModel('PosModifierGroup').create(item)
              this.newGroup = null
            }
            break
          case 'category':
            if (item._id) {
              await cms.getModel('PosModifierCategory').findOneAndUpdate({ _id: item._id }, item, { new: true })
            } else {
              newItem = await cms.getModel('PosModifierCategory').create(item)
              this.newCategory = null
            }
            this.newCategory = null
            break
          case 'modifier':
            if (item._id) {
              await cms.getModel('PosPopupModifier').findOneAndUpdate({ _id: item._id }, item, { new: true })
            } else {
              newItem = await cms.getModel('PosPopupModifier').create(item)
              this.newModifier = null
            }
            break
          default:
            return;
        }

        await this.reload()
        this.activeGroup = this.modifierGroups.find(g => g._id === this.activeGroup._id)
        return newItem
      },
      async deleteItem(type) {
        const _id = this.activeEditItem._id

        switch (type) {
          case 'group':
            if (_id) {
              await cms.getModel('PosModifierGroup').deleteOne({ _id })
            } else {
              this.newGroup = null
            }
            this.activeGroup = null
            break
          case 'category':
            if (_id) {
              await cms.getModel('PosModifierCategory').deleteOne({ _id })
            } else {
              this.newCategory = null
            }
            this.activeCategory = null
            break
          case 'modifier':
            if (_id) {
              await cms.getModel('PosPopupModifier').deleteOne({ _id })
            } else {
              this.newModifier = null
            }
            this.activeModifier = null
            break
          default:
            return
        }
        this.activeEditItem = null
        await this.reload()
        if (this.activeGroup) {
          this.activeGroup = this.modifierGroups.find(g => g._id === this.activeGroup._id)
        } else if (this.modifierGroups.length) this.activeGroup = this.modifierGroups[0]
      },
      close() {
        this.internalValue = false
      }
    },
    watch: {
      async activeGroup(newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
          this.categories = await this.getCategories(newVal)
          this.modifiers = await this.getModifiers(newVal)
          if (oldVal && newVal._id === oldVal._id) {
            if (this.activeCategory) this.activeCategory = this.categories.find(c => c._id === this.activeCategory._id)
            if (this.activeModifier) this.activeModifier = this.modifiers.find(m => m._id === this.activeModifier._id)
          }
        }
      },
      value: {
        async handler(newVal) {
          if (newVal) {
            await this.reload(() => {
              if (this.modifierGroups.length) this.setActiveGroup(this.modifierGroups[0])
            })
          } else {
            this.newCategory = null
            this.newGroup = null
            this.newModifier = null
          }
        },
        immediate: true
      },
      activeEditItem: {
        handler: _.debounce(function (val) {
          if (val) this.save()
        }, 500),
        deep: true
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
    border: 1px solid #D0D0D0;
    border-radius: 2px;
    font-weight: bold;
  }

  .active-btn {
    background: #E3F2FD !important;
    border: 1px solid #90CAF9 !important;
  }

  .edit-btn {
    border: 2px solid #1271FF !important;
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
