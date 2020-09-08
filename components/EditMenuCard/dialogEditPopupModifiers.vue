<template>
  <div v-if="internalValue" class="wrapper col-flex">
    <div class="header">
      <template v-for="group in allGroups">
        <g-btn outlined :uppercase="false" background-color="#F0F0F0" :key="group._id"
               :class="[activeGroup === group && 'active-btn', activeEditItem && activeEditItem._id === group._id && 'edit-btn']"
               @click="setActiveGroup(group)">
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
            <g-text-field-bs label="Name" v-model="activeEditItem.name" required>
              <template #append-inner>
                <g-icon style="cursor: pointer" @click.stop="showDialog = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <div class="fs-small-2 i mr-1 ml-1">
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
            <g-text-field-bs label="Name" required v-model="activeEditItem.name">
              <template #append-inner>
                <g-icon style="cursor: pointer" @click.stop="showDialog = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <g-text-field-bs label="No. of free items" v-model="activeEditItem.freeItems">
              <template #append-inner>
                <g-icon style="cursor: pointer" @click.stop="showDialog = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <g-btn :uppercase="false" flat background-color="#FF4452" text-color="#fff"
                   style="margin: 8px 4px 0 4px"
                   @click="deleteItem('category')">
              <g-icon color="#fff" size="18" class="mr-2">delete</g-icon>
              <span>Delete this category</span>
            </g-btn>
          </template>

          <!-- Modifier -->
          <template v-if="activeEditItem && activeEditItem.type === 'modifier'">
            <g-text-field-bs label="Name" required v-model="activeEditItem.name">
              <template #append-inner>
                <g-icon style="cursor: pointer" @click.stop="showDialog = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <g-text-field-bs label="Price" v-model="activeEditItem.price">
              <template #append-inner>
                <g-icon style="cursor: pointer" @click.stop="showDialog = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <g-text-field-bs label="Max items" v-model="activeEditItem.max">
              <template #append-inner>
                <g-icon style="cursor: pointer" @click.stop="showDialog = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <div>
              <div style="font-size: 13px; margin: 12px 4px 2px 4px;">Group printer</div>
              <g-grid-select class="ml-1 mr-1 mb-2" v-model="activeEditItem.printer"
                             item-text="name" item-value="_id" :items="groupPrinters" itemCols="auto">
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
              <g-icon color="#fff" size="18" class="mr-2">delete</g-icon>
              <span>Delete this item</span>
            </g-btn>
          </template>
        </div>

        <div class="row-flex flex-grow-1 align-items-end">
          <g-btn flat background-color="#ff4452" text-color="#fff" border-radius="0"
                 @click="close" style="flex: 1; margin: 0">
            Close
          </g-btn>
        </div>
      </div>
    </div>

    <dialog-form-input v-model="showDialog" :show-buttons="false" @save="showDialog = false">
      <template #input="{ changeKeyboard }">
        <div class="mb-4">
          <template v-if="activeEditItem && activeEditItem.type === 'group'">
            <g-text-field-bs label="Name" v-model="activeEditItem.name" required clearable/>
          </template>
          <template v-else-if="activeEditItem && activeEditItem.type === 'category'">
            <g-text-field-bs label="Name" required clearable v-model="activeEditItem.name"  @click.native.stop="changeKeyboard('alpha')"/>
            <g-text-field-bs label="No. of free items" clearable v-model="activeEditItem.freeItems" @click.native.stop="changeKeyboard('numeric')"/>
          </template>
          <template v-else-if="activeEditItem && activeEditItem.type === 'modifier'">
            <g-text-field-bs label="Name" required clearable v-model="activeEditItem.name" @click.native.stop="changeKeyboard('alphanumeric')"/>
            <g-text-field-bs label="Price" clearable v-model="activeEditItem.price" @click.native.stop="changeKeyboard('numeric')"/>
            <g-text-field-bs label="Max items" clearable v-model="activeEditItem.max" @click.native.stop="changeKeyboard('numeric')"/>
          </template>
        </div>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import PosTextField from '../pos-shared-components/POSInput/PosTextField';
  import DialogFormInput from '../pos-shared-components/dialogFormInput';

  export default {
    name: 'dialogEditPopupModifiers',
    components: { DialogFormInput, PosTextField },
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
        modifiers: [],
        showDialog: false,
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
        return await cms.getModel('PosModifierCategory').find(filter).lean()
      },
      async getModifiers(group) {
        if (!group._id) return []
        const filter = { modifierGroup: group._id }
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
          freeItems: 0
        }
        this.setActiveCategory(this.newCategory)
        const newItem = await this.save()
        this.setActiveCategory(newItem)
      },
      async addGroup() {
        this.newGroup = {
          name: 'New Group'
        }
        this.setActiveGroup(this.newGroup)
        const newItem = await this.save()
        this.setActiveGroup(newItem)
      },
      async addMod(category) {
        this.newModifier = {
          name: 'New modifier',
          price: 0,
          category: category._id,
          modifierGroup: this.activeGroup._id,
          max: 1
        }
        this.setActiveModifier(this.newModifier)
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
          name: `${this.activeEditItem.name} (copy)`
        })
        await Promise.all(
          _.map(this.modifiersByCategory, (async (mods, catId) => {
            const { freeItems, mandatory, name, selectOne } = this.categories.find(cat => cat._id === catId)
            const newCategory = await cms.getModel('PosModifierCategory').create(
              { modifierGroup: newGroup._id, name, mandatory, selectOne, freeItems})
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
              await cms.getModel('PosModifierCategory').deleteMany({ modifierGroup: _id })
              await cms.getModel('PosPopupModifier').deleteMany({ modifierGroup: _id })
              await cms.getModel('PosModifierGroup').deleteOne({ _id })
            } else {
              this.newGroup = null
            }
            this.activeGroup = null
            break
          case 'category':
            if (_id) {
              await cms.getModel('PosPopupModifier').deleteMany({ category: _id })
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
    bottom: 0;
    right: 0;
    z-index: 99;
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
