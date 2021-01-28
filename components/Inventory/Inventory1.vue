<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <g-simple-table striped fixed-header style="flex: 1">
      <thead>
      <tr>
        <th></th>
        <th>ID</th>
        <th>
          {{ $t('article.name') }}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th>{{ $t('inventory.lastUpdate') }}</th>
        <th>
          {{ $t('article.category') }}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th>{{ $t('inventory.unit') }}</th>
        <th>{{ $t('inventory.stock') }}</th>
      </tr>
      </thead>
      <!-- Filter row -->
      <tr>
        <td class="bg-grey-lighten-1">
          <!-- TODO: using :value or :model-value? -->
          <g-checkbox v-if="inventories && inventories.length !== 0" v-model="selectedInventoryIDs" :value="listIDs"
                      multiple>
            <template v-slot:label>
              <g-icon size="16" class="mb-1">fas fa-caret-down</g-icon>
            </template>
          </g-checkbox>
          <g-checkbox v-else/>
        </td>
        <td colspan="6" class="filter-wrapper">
          <div class="filter">
            {{ $t('settings.filter') }}
            <div class="group-chip">
              <g-chip v-for="(filter, i) in inventoryFilters" :key="filter.title" label small background-color="white"
                      close class="ma-1" @close="removeFilter(filter)">
                <div>
                  <span class="chip-title">{{ filter.title }}: </span>
                  <span class="chip-content">{{ filter.text }}</span>
                </div>
              </g-chip>
            </div>
            <g-btn-bs v-if="inventoryFilters && inventoryFilters.length > 0" @click="clearFilter">
              <u>{{ $t('settings.clearAll') }}</u>
            </g-btn-bs>
            <g-spacer/>
            <div class="btn-add-filter" @click="dialog.filter = true">+ {{ $t('inventory.addFilter') }}</div>
          </div>
        </td>
      </tr>
      <!-- Data row -->
      <tr v-for="(inventory, i) in inventories" :key="i">
        <td>
          <!-- TODO: using :value or :model-value? -->
          <g-checkbox v-model="selectedInventoryIDs" :value="inventory._id" @change="getFirstSelectedInventory"/>
        </td>
        <td @click="editInventory(inventory)">{{ inventory.id }}</td>
        <td @click="editInventory(inventory)">{{ inventory.name }}</td>
        <td @click="editInventory(inventory)">{{ formatDate(inventory.lastUpdateTimestamp) }}</td>
        <td @click="editInventory(inventory)">{{ inventory.category.name }}</td>
        <td @click="editInventory(inventory)">{{ inventory.unit }}</td>
        <td @click="openDialogStock(inventory)">
          <div class="row-flex justify-between">
            {{ $filters.formatCurrency(inventory.stock) }}
            <g-icon size="18" color="#757575">edit</g-icon>
          </div>
        </td>
      </tr>
    </g-simple-table>
    <!--    <pos-table-pagination @execQueryByPage="updatePagination"-->
    <!--                          :total-document="totalInventories"-->
    <!--                          :limit.sync="limit"-->
    <!--                          :current-page.sync="currentPage"/>-->
    <div>
      <g-toolbar color="#eeeeee" elevation="0">
        <g-btn :uppercase="false" style="margin-right: 5px" @click="back">
          <g-icon small style="margin-right: 5px">icon-back</g-icon>
          {{ $t('ui.back') }}
        </g-btn>
        <g-btn :uppercase="false" @click="goToReportPage">
          <g-icon small style="margin-right: 5px">icon-inventory-report</g-icon>
          {{ $t('inventory.report') }}
        </g-btn>
        <g-spacer/>
        <g-btn :uppercase="false" style="margin-right: 5px" @click="goToStockPage">
          <g-icon small style="margin-right: 5px">icon-inventory-new-stock</g-icon>
          {{ $t('inventory.newStock') }}
        </g-btn>
        <g-btn :uppercase="false" style="margin-right: 5px" @click="dialog.category = true">
          <g-icon small style="margin-right: 5px">icon-inventory-category</g-icon>
          {{ $t('article.category') }}
        </g-btn>
        <g-btn :disabled="selectedInventoryIDs.length === 0" :uppercase="false" style="margin-right: 5px" @click="removeInventory">
          <g-icon small style="margin-right: 5px">icon-inventory-delete</g-icon>
          {{ $t('ui.delete') }}
        </g-btn>
        <g-btn :disabled="selectedInventoryIDs.length === 0" :uppercase="false" style="margin-right: 5px" @click="openDialogInventory('edit')">
          <g-icon small style="margin-right: 5px">icon-inventory-edit</g-icon>
          {{ $t('ui.edit') }}
        </g-btn>
        <g-btn :uppercase="false" background-color="#4CAF50" text-color="#FFF" @click="openDialogInventory('add')">
          <span style="font-size: 14px !important">+ {{ $t('inventory.newProduct') }}</span>
        </g-btn>
      </g-toolbar>
    </div>

    <dialog-form-input v-model="dialog.inventory" @submit="submitInventory">
      <template #input>
        <div class="row-flex flex-wrap justify-around" :key="dialog.inventory">
          <pos-textfield-new style="width: 48%" label="Name" v-model="name" required/>
          <pos-textfield-new :disabled="dialog.mode === 'edit'"
                             :rules="[val => !isNaN(val) || 'Must be a number!']" style="width: 48%" :label="$t('inventory.stock')" v-model="stock" required/>
          <g-select menu-class="menu-select-inventory" outlined style="width: 48%" :label="$t('article.category')"
                    :items="inventoryCategories" item-text="name" item-value="_id" v-model="category" required/>
          <g-select menu-class="menu-select-inventory" outlined style="width: 48%" :label="$t('inventory.unit')" :items="units" v-model="unit" required/>
        </div>
      </template>
    </dialog-form-input>

    <dialog-change-stock v-model="dialog.stock"
                         :name="selectedInventory && selectedInventory.name"
                         :stock="selectedInventory && selectedInventory.stock"
                         @submit="updateStock"/>

    <dialog-inventory-category v-model="dialog.category" @submit="loadData"/>

    <dialog-form-input v-model="dialog.filter" @submit="changeFilter">
      <template v-slot:input>
        <div class="row-flex flex-wrap justify-around mt-2">
          <pos-textfield-new style="width: 30%" label="Product ID" v-model="filter.id" clearable/>
          <pos-textfield-new style="width: 30%" label="Name" v-model="filter.name" clearable/>
          <g-select menu-class="menu-select-inventory" text-field-component="PosTextfieldNew" outlined style="width: 30%" :label="$t('article.category')" clearable
                    :items="inventoryCategories" item-text="name" return-object v-model="filter.category"/>
          <div class="col-12 row-flex">
            <p style="margin-top: 35px; margin-left: 16px">Stock Range:</p>
            <pos-range-slider :min="0" :max="1000" prefix="" v-model="filter.stock"/>
          </div>
        </div>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import {units} from './unit'
  import _ from 'lodash'
  import PosRangeSlider from '../pos-shared-components/POSInput/PosRangeSlider';
  import PosTextfieldNew from '../pos-shared-components/POSInput/PosTextfieldNew';
  import dialogFormInput from '../pos-shared-components/dialogFormInput';
  import dialogChangeStock from './dialogChangeStock';
  import dialogInventoryCategory from './dialogInventoryCategory';

  export default {
    name: 'Inventory1',
    injectService: ['InventoryStore:(inventories, loadInventories, createInventory, updateInventory, deleteInventory, updateInventoryHistory,' +
                                    'inventoryCategories, loadInventoryCategories, selectedInventory, selectedInventoryIDs, inventoryPagination, totalInventories)'],
    components: {PosRangeSlider, PosTextfieldNew, dialogFormInput, dialogChangeStock, dialogInventoryCategory},
    props: {},
    data: function () {
      return {
        dialog: {
          filter: false,
          inventory: false,
          mode: 'add',
          stock: false,
          category: false,
        },
        name: '',
        stock: '',
        category: '',
        unit: '',
        units: units,
        filter: {
          name: '',
          id: '',
          category: '',
          stock: [0, 0],
        },
        // inject
        inventories: [],
        inventoryFilters: [],
        inventoryCategories: [],
        selectedInventory: null,
        selectedInventoryIDs: [],
        inventoryPagination: { limit: 15, currentPage: 1 },
        totalInventories: null
      }
    },
    async created() {
      // it's take time to injectService so we need delay the invocation
      // TODO: find better solution
      setTimeout(async () => {
        try {
          await this.loadInventories()
          await this.loadInventoryCategories()
        } catch (e) {
          console.error(e)
        }
      }, 100)
    },
    async activated() {
      console.log('activated')
      await this.loadInventories()
      await this.loadInventoryCategories()
    },
    computed: {
      limit: {
        get() {
          if (this.inventoryPagination)
            return this.inventoryPagination.limit;
          return 15
        },
        set(val) {
          this.inventoryPagination.limit = val;
        }
      },
      currentPage: {
        get() {
          if (this.inventoryPagination)
            return this.inventoryPagination.currentPage;
          return 1
        },
        set(val) {
          this.inventoryPagination.currentPage = val;
        }
      },
      listIDs() {
        return this.inventories.map(i => i._id);
      }
    },
    methods: {
      back() {
        this.$router.push({ path: '/pos-dashboard' });
      },
      goToReportPage() {
        this.$router.push({ path: '/pos-inventory-report' });
      },
      goToStockPage() {
        this.$router.push({ path: '/pos-inventory-stock' });
      },
      updatePagination() {

      },
      getFirstSelectedInventory() {
        if (this.selectedInventoryIDs.length > 0) {
          this.selectedInventory = this.inventories.find(p => p._id === this.selectedInventoryIDs[0])
        } else {
          this.selectedInventory = null;
        }
      },
      clearData() {
        this.name = ''
        this.stock = ''
        this.category = ''
        this.unit = 'piece'
      },
      openDialogInventory(mode) {
        this.dialog.mode = mode
        if (mode === 'edit') {
          this.name = _.cloneDeep(this.selectedInventory.name)
          this.stock = (_.cloneDeep(this.selectedInventory.stock)).toFixed(2)
          this.category = _.cloneDeep(this.selectedInventory.category._id)
          this.unit = _.cloneDeep(this.selectedInventory.unit)
        } else {
          this.clearData()
        }
        this.dialog.inventory = true
      },
      async loadData() {
        this.selectedInventory = null
        this.selectedInventoryIDs = []
        this.inventoryFilters = []
        await this.loadInventories()
      },
      async submitInventory() {
        if(!this.name || !this.category || !this.unit || !this.stock || isNaN(this.stock)) return
        const inventory = {
          name: this.name,
          category: this.category,
          unit: this.unit,
          stock: this.stock
        }
        if(this.dialog.mode === 'add') {
          await this.createInventory(inventory)
        } else {
          await this.updateInventory({...inventory, _id: this.selectedInventory._id})
          if(this.stock !== this.selectedInventory.stock) {
            const history = {
              inventory: this.selectedInventory._id,
              category: this.category,
              type: this.stock > this.selectedInventory.stock ? 'add' : 'remove',
              amount: Math.abs(this.stock - this.selectedInventory.stock),
              date: new Date(),
              reason: 'Update stock'
            }
            await this.updateInventoryHistory(history)
          }
        }
        await this.loadData()
        this.dialog.inventory = false
      },
      async removeInventory() {
        await this.deleteInventory(this.selectedInventoryIDs)
        await this.loadData()
      },
      openDialogStock(inventory) {
        this.selectedInventory = inventory
        this.dialog.stock = true
      },
      async updateStock({type, change, value, reason}) {
        await this.updateInventory({
          ...this.selectedInventory,
          category: this.selectedInventory.category._id,
          stock: value
        })
        const history = {
          inventory: this.selectedInventory._id,
          category: this.selectedInventory.category._id,
          type,
          amount: change,
          date: new Date(),
          reason: reason || 'Update stock'
        }
        await this.updateInventoryHistory(history)
        await this.loadData()
      },
      async changeFilter() {
        let filters = []
        if(this.filter.name) {
          filters.push({
            title: 'Name',
            text: `'${this.filter.name}'`,
            condition: {name: {"$regex": this.filter.name, "$options": 'i'}}
          })
        }
        if(this.filter.category) {
          filters.push({
            title: 'Category',
            text: this.filter.category.name,
            condition: {category: this.filter.category._id}
          })
        }
        if(this.filter.id) {
          filters.push({
            title: 'ID',
            text: `'${this.filter.id}'`,
            condition: {id: this.filter.id}
          })
        }
        if(this.filter.stock && this.filter.stock[1]) {
          filters.push({
            title: 'Stock',
            text: this.filter.stock[0] ? (this.filter.stock[0] + ' - ') : '≤ ' + this.filter.stock[1],
            condition: {stock: { ...this.filter.stock[0] && {'$gte': this.filter.stock[0]}, '$lte': this.filter.stock[1] }}
          })
        }
        this.inventoryFilters = filters
        await this.loadInventories(this.inventoryFilters)
        this.dialog.filter = false
      },
      editInventory(inventory) {
        this.selectedInventory = inventory
        this.openDialogInventory('edit')
      },
      formatDate(date) {
        if (!date || !dayjs(date).isValid()) return ''
        return dayjs(date).format('DD/MM/YYYY HH:mm')
      },
      async removeFilter(filter) {
        const index = this.inventoryFilters.findIndex(f => f.title === filter.title);
        this.inventoryFilters.splice(index, 1);
        if(filter.title.toLowerCase() === 'stock') {
          this.filter.stock = [0, 0]
        } else {
          this.filter[filter.title.toLowerCase()] = ''
        }
        this.inventoryPagination.currentPage = 1;
        await this.loadInventories(this.inventoryFilters);
      },
      async clearFilter() {
        this.inventoryFilters = [];
        this.inventoryPagination.currentPage = 1;
        this.filter = {
          name: '',
          id: '',
          category: '',
          stock: [0, 0],
        }
        await this.loadInventories();
      },
      // inject
      loadInventories() { console.log("injectService.InventoryStore::loadInventories not injected")  },
      createInventory() { console.log("injectService.InventoryStore::createInventory not injected")  },
      updateInventory() { console.log("injectService.InventoryStore::updateInventory not injected")  },
      deleteInventory() { console.log("injectService.InventoryStore::deleteInventory not injected")  },
      updateInventoryHistory() { console.log("injectService.InventoryStore::updateInventoryHistory not injected")  },
      loadInventoryCategories() { console.log("injectService.InventoryStore::loadInventoryCategories not injected")  },
    }
  }
</script>
<style scoped lang="scss">
  .g-table {
    height: calc(100% - 64px);

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
      -webkit-tap-highlight-color: transparent;
    }

    tr td {
      padding: 0 8px;
      font-size: 13px;
      line-height: 16px;
      height: 33px
    }

    tr td:first-child,
    tr th:first-child {
      padding-right: 0;
    }

    tr {
      td:nth-child(1),
      th:nth-child(1) {
        width: 5%;
      }

      td:nth-child(2):not(.filter-wrapper),
      th:nth-child(2) {
        width: 10%;
      }

      td:nth-child(3),
      th:nth-child(3) {
        width: 30%;
      }

      td:nth-child(4),
      th:nth-child(4) {
        width: 15%;
      }

      td:nth-child(5),
      th:nth-child(5) {
        width: 15%;
      }

      td:nth-child(6),
      th:nth-child(6) {
        width: 10%;
      }

      td:nth-child(7),
      th:nth-child(7) {
        width: 10%;
      }
    }

    .sticky {
      td {
        position: sticky;
        z-index: 2;
        top: 48px;
      }
    }

    .filter-wrapper {
      background-color: #bdbdbd;
      height: 48px;

      .filter {
        color: #1d1d26;
        font-size: 13px;
        line-height: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;

        .group-chip {
          display: flex;
          flex-wrap: nowrap;
          overflow: auto;
          margin: 0 4px;

          &::-webkit-scrollbar {
            display: none;
          }

          ::v-deep .g-chip {
            overflow: visible;
          }

          .chip-title {
            color: #97A3B4;
            font-weight: 400;
            font-size: 11px;
          }

          .chip-content {
            color: #1D1D26;
            font-weight: 700;
            font-size: 12px;
          }
        }

        .btn-add-filter {
          border-radius: 4px;
          background-color: #2979ff;
          color: white;
          padding: 10px;
          cursor: pointer;
          font-size: 14px;
        }
      }
    }
  }

  .g-select ::v-deep .g-tf-wrapper {
    margin: 16px 0 4px;
    width: 100%;

    .g-tf-input--fake-caret span {
      color: rgba(0, 0, 0, 0.87)
    }

    fieldset {
      border-color: #C9C9C9;
      border-radius: 2px;
    }

    &.g-tf__focused fieldset {
      border-color: #1867c0;
    }

    .g-tf-label {
      font-weight: bold;
      color: #1D1D26;
    }

    .input {
      padding-left: 6px;
    }
  }

  @media screen and (max-height: 599px) {
    .g-table {
      thead tr th {
        height: 36px;
      }

      tr td {
        height: 28px;
      }

      .filter-wrapper {
        height: 36px;

        .filter {
          .btn-add-filter {
            padding: 4px 8px;
            font-size: 12px;
          }
        }
      }
    }
  }

  @media screen and (max-width: 1023px) {
    .g-toolbar {
      .g-btn ::v-deep .g-btn__content {
        font-size: 0;

        .g-icon {
          margin-right: 0 !important;
          font-size: 24px !important;
          width: 24px !important;
          height: 24px !important;
        }
      }
    }
  }
</style>

<style lang="scss">
  @media screen and (max-height: 599px) {
    .menu-select-inventory {
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
