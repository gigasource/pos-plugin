<template>
  <div class="inventory-stock">
    <div class="inventory-stock__header">
      <g-autocomplete text-field-component="GTextFieldBs" @update:modelValue="selectItem" clearable keep-menu-on-blur
                      :items="inventories" return-object menu-class="menu-inventory-stock">
        <template v-slot:append-inner>
          <g-icon @click="showKeyboard = true">icon-keyboard</g-icon>
        </template>
      </g-autocomplete>
      <div class="inventory-stock__header-btn" @click="openDialog()">
        <g-icon color="white">add</g-icon>
      </div>
      <g-spacer/>
      <span class="fs-small">{{ $t('inventory.products') }}: </span>
      <span class="fs-large text-red ml-1">{{ items.length }}</span>
    </div>
    <g-simple-table striped fixed-header style="flex: 1">
      <thead>
      <tr>
        <th>Product ID</th>
        <th>Name</th>
        <th>{{ $t('article.category') }}</th>
        <th>{{ $t('inventory.unit') }}</th>
        <th>{{ $t('inventory.currentStock') }}</th>
        <th>{{ $t('inventory.addedStock') }}</th>
        <th></th>
      </tr>
      </thead>
      <tr v-for="(inventory, i) in items" :key="i" :class="selectedItem && selectedItem._id === inventory._id && 'row--selected'">
        <td @click="openDialogAdd(inventory)">{{ inventory.id }}</td>
        <td @click="openDialogAdd(inventory)">{{ inventory.name }}</td>
        <td @click="openDialogAdd(inventory)">{{ inventory.category.name }}</td>
        <td @click="openDialogAdd(inventory)">{{ inventory.unit }}</td>
        <td @click="openDialogAdd(inventory)">{{ $filters.formatCurrency(inventory.stock) }}</td>
        <td class="fw-700 text-blue" @click="openDialogAdd(inventory)">{{ inventory.added }}</td>
        <td @click="removeItem(i)">
          <g-icon color="red">cancel</g-icon>
        </td>
      </tr>
    </g-simple-table>
    <div>
      <g-toolbar color="#eeeeee">
        <g-btn :uppercase="false" style="margin-right: 5px" @click="back">
          <g-icon small style="margin-right: 5px">icon-back</g-icon>
          {{ $t('ui.back') }}
        </g-btn>
        <g-btn :uppercase="false" @click="dialog.low = true">
          {{ $t('inventory.importLowStock') }}
        </g-btn>
        <g-spacer/>
        <g-btn :uppercase="false" background-color="#4CAF50" text-color="#FFF" @click="complete">
          <g-icon small style="margin-right: 5px">icon-inventory-new-stock</g-icon>
          {{ $t('inventory.complete') }}
        </g-btn>
      </g-toolbar>
    </div>

    <dialog-form-input v-model="dialog.inventory" @submit="changeStock">
      <template v-slot:input>
        <div class="row-flex flex-wrap justify-around">
          <g-autocomplete text-field-component="GTextFieldBs" v-model="itemId" style="width: 98%"
                          class="inventory-stock-select" :key="dialog.inventory"
                          :items="inventories" item-text="name" item-value="_id" keep-menu-on-blur
                          menu-class="menu-select-inventory"
                          @update:modelValue="chooseItem"/>
          <pos-textfield-new readonly style="width: 48%" v-model="category" :label="$t('article.category')"/>
          <pos-textfield-new readonly style="width: 48%" v-model="unit" :label="$t('inventory.unit')"/>
          <pos-textfield-new readonly style="width: 48%" v-model="stock" :label="$t('inventory.currentStock')"/>
          <pos-textfield-new :rules="[val => !isNaN(val) || 'Must be a number!']" style="width: 48%" v-model="added"
                             :label="$t('inventory.addedStock')"/>
        </div>
      </template>
    </dialog-form-input>

    <dialog-number-filter v-model="dialog.low" label="Low-stock threshold" @submit="getLowStockItems"/>
    <dialog-change-stock v-model="dialog.add"
                         :removeable="false"
                         :name="name"
                         :stock="stock"
                         @submit="updateStock"/>
    <div v-if="showKeyboard" class="keyboard-wrapper">
      <pos-keyboard-full type="alpha-number"/>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import DialogChangeStock from "./dialogChangeStock";
  import PosKeyboardFull from "../pos-shared-components/PosKeyboardFull";

  export default {
    name: "InventoryStock",
    components: {PosKeyboardFull, DialogChangeStock},
    injectService: ['InventoryStore:(updateInventory, updateInventoryHistory)'],
    props: {},
    data() {
      return {
        items: [],
        inventories: [],
        selectedItem: null,
        dialog: {
          inventory: false,
          low: false,
          add: false,
        },
        name: '',
        itemId: '',
        category: '',
        unit: '',
        stock: 0,
        added: 0,
        showKeyboard: false
      }
    },
    async created() {
      const inventories = await cms.getModel('Inventory').find();
      const categories = await cms.getModel('InventoryCategory').find();
      this.inventories = inventories.map(item => ({
        ...item,
        text: item.name,
        category: categories.find(cate => cate._id.toString() === item.category)
      }))
      this.items = []
      this.selectedItem = null
      document.addEventListener('click', e => {
        const target = e.target
        if( !target.classList.contains('key') && (!target.parentElement || !target.parentElement.classList.contains('key'))
            && !target.classList.contains('g-icon') && target.tagName !== 'INPUT') {
          this.showKeyboard = false
        }
      })
      this.keyboardHandler = this.keyboardHandle.bind(this)
      window.addEventListener('keydown', this.keyboardHandler, false)
    },
    async activated() {
      const inventories = await cms.getModel('Inventory').find();
      const categories = await cms.getModel('InventoryCategory').find();
      this.inventories = inventories.map(item => ({
        ...item,
        text: item.name,
        category: categories.find(cate => cate._id.toString() === item.category)
      }))
      this.items = []
      this.selectedItem = null
      window.addEventListener('keydown', this.keyboardHandler, false)
    },
    deactivated() {
      window.removeEventListener('keydown', this.keyboardHandler, false)
    },
    computed: {},
    methods: {
      back() {
        this.$router.push({path: '/pos-inventory'});
      },
      openDialog() {
        this.itemId = ''
        this.category = ''
        this.unit = ''
        this.stock = 0
        this.added = ''
        this.dialog.inventory = true
      },
      changeStock() {
        if (isNaN(this.added)) return
        const item = this.inventories.find(item => item._id === this.itemId)
        const index = this.items.findIndex(i => i._id === item._id)
        if (index === -1)
          this.items.push({
            ...item,
            added: +this.added
          })
        else
          this.items.splice(index, 1, {
            ...item,
            added: +this.added
          })
        this.dialog.inventory = false
      },
      openDialogAdd(item) {
        if (item) {
          this.itemId = _.cloneDeep(item._id)
          this.name = _.cloneDeep(item.name)
          this.category = _.cloneDeep(item.category.name)
          this.unit = _.cloneDeep(item.unit)
          this.stock = _.cloneDeep(+item.stock)
          this.added = _.cloneDeep(+item.added)
        }
        this.selectedItem = item
        this.dialog.add = true
      },
      updateStock({change}) {
        const item = this.inventories.find(item => item._id === this.itemId)
        const index = this.items.findIndex(i => i._id === item._id)
        if (index === -1) {
          this.items.push({
            ...item,
            added: +change
          })
          this.selectedItem = _.last(this.items)
        } else {
          this.items.splice(index, 1, {
            ...item,
            added: +change
          })
          this.selectedItem = this.items[index]
        }
      },
      chooseItem(_id) {
        const item = this.inventories.find(item => item._id === _id)
        this.category = _.cloneDeep(item.category.name)
        this.unit = _.cloneDeep(item.unit)
        this.stock = item.stock && +(_.cloneDeep(item.stock)).toFixed(2)
        this.added = ''
      },
      selectItem(item) {
        if (item && !this.items.find(i => i._id === item._id))
          this.items.push({
            ...item,
            added: 0
          })
        this.showKeyboard = false
      },
      removeItem(index) {
        this.items.splice(index, 1)
      },
      getLowStockItems(value) {
        const items = this.inventories.filter(item => item.stock <= value && !this.items.find(i => i._id === item._id)).map(item => ({
          ...item,
          added: 0
        }))
        this.items.push(...items)
        this.dialog.low = false
      },
      async complete() {
        const updateItems = this.items.filter(item => item.added).map(item => ({
          ...item,
          stock: item.stock + item.added
        }))
        for (const item of updateItems) {
          await this.updateInventory(item)
          const history = {
            inventory: item._id,
            category: item.category._id,
            type: 'add',
            amount: item.added,
            date: new Date(),
            reason: 'Import stock'
          }
          await this.updateInventoryHistory(history)
        }
        this.back()
      },
      keyboardHandle(event) {
        event.stopPropagation()
        if(event.key === 'Tab' || event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault()
          if(this.items.length > 0) {
            if(!this.selectedItem) {
              this.selectedItem = this.items[0]
            } else {
              const index = this.items.findIndex(i => i._id === this.selectedItem._id)
              if(index === this.items.length - 1) {
                this.selectedItem = this.items[0]
              } else {
                this.selectedItem = this.items[index + 1]
              }
            }
          }
        }
        if(event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault()
          if(this.items.length > 0) {
            if(!this.selectedItem) {
              this.selectedItem = _.last(this.items)
            } else {
              const index = this.items.findIndex(i => i._id === this.selectedItem._id)
              if(index === 0) {
                this.selectedItem = _.last(this.items)
              } else {
                this.selectedItem = this.items[index - 1]
              }
            }
          }
        }
        if(event.key === 'Enter') {
          if(this.selectedItem) {
            this.openDialogAdd(this.selectedItem)
          }
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .inventory-stock {
    height: 100%;
    display: flex;
    flex-direction: column;

    &__header {
      padding: 8px 16px;
      background-color: #bdbdbd;
      display: flex;
      align-items: center;

      .g-autocomplete {
        flex: 1;

        ::v-deep .bs-tf-wrapper {
          margin: 0;
          width: 100%;
          background-color: white;
          border-radius: 4px;
        }
      }

      &-btn {
        margin-left: 4px;
        height: 100%;
        border-radius: 2px;
        background-color: #1271FF;
        flex: 0 0 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .g-table {
      height: calc(100% - 118px);

      ::v-deep table {
        table-layout: fixed;
      }

      thead tr th {
        font-size: 13px;
        color: #1d1d26;
        padding: 0 8px;
        background-color: #fff;
        cursor: pointer;
        text-align: left;
      }

      tr td {
        padding: 0 8px;
        font-size: 13px;
        line-height: 16px;
        height: 33px
      }


      tr {
        td:nth-child(1),
        th:nth-child(1) {
          width: 10%;
        }

        td:nth-child(2),
        th:nth-child(2) {
          width: 30%;
        }

        td:nth-child(3),
        th:nth-child(3) {
          width: 15%;
        }

        td:nth-child(4),
        th:nth-child(4) {
          width: 10%;
        }

        td:nth-child(5),
        th:nth-child(5) {
          width: 15%;
        }

        td:nth-child(6),
        th:nth-child(6) {
          width: 15%;
        }

        td:nth-child(7),
        th:nth-child(7) {
          width: 5%;
        }

        &.row--selected {
          td {
            border-top: 2px solid #1271FF;
            border-bottom: 2px solid #1271FF;
          }

          td:first-child {
            border-left: 2px solid #1271FF;
          }

          td:last-child {
            border-right: 2px solid #1271FF;
          }
        }
      }
    }

    .keyboard-wrapper {
      position: absolute;
      z-index: 2;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px;
      background-color: #BDBDBD;
    }
  }
</style>

<style lang="scss">
  .inventory-stock-select {
    .bs-tf-wrapper {
      margin: 16px 0 0;
      width: 100%;
    }
  }

  .menu-inventory-stock {
    .g-list .g-list-item__active {
      color: rgba(0, 0, 0, 0.87);

      &:before {
        display: none;
      }
    }
  }

  @media screen and (max-height: 599px) {
    .menu-inventory-stock {
      .g-list {
        .g-list-item {
          min-height: 0;
          padding: 4px;

          .g-list-item-content {
            margin: 0;

            .g-list-item-text {
              text-align: left;
            }
          }
        }
      }
    }
  }
</style>
