<template>

</template>
<script>
  import { getProvided } from '../logic/commonUtils';
  
  const INVENTORY_COL = 'Inventory'
  const INVENTORY_CATEGORY_COL = 'InventoryCategory'
  const INVENTORY_UNIT_COL = 'InventoryUnit'
  const COMMIT_COL = 'OrderCommit'
  
  export default {
    name: 'InventoryStore',
    domain: 'InventoryStore',
    injectService: ['PosStore:user'],
    props: {},
    data: function () {
      return {
        // inventory explore
        inventories: [],
        inventoryCategories: [],
        inventoryUnits: [],
        inventoryFilters: [],
        inventoryPagination: { limit: 15, currentPage: 1 },
        totalInventories: null,
        selectedInventory: null,
        
        // inventory import
        // to resolve update conflict if this case occured
        inventoriesLoadTimestamp: null,
        // list all inventory in current import
        importingInventories: [],
        
        // dialog
        dialog: {
          deleteInventory: {
            show: false,
          }
        }
      }
    },
    computed: {
      // list all inventory which existed in inventories but not included in current import
      importingInventorySearchItems() {
        const searchItems = []
        for(let inv of this.inventories) {
          if (this.importingInventories.indexOf(t => t._id === inv._id) < 0)
            searchItems.push(searchItems)
        }
        return searchItems
      }
    },
    created() {
      // register socket to listen on inventory change request from master device
    },
    methods: {
      // category
      async loadInventoryCategories() {
        const inventoryCates = await cms.getModel(INVENTORY_CATEGORY_COL).find({})
        this.$set(this, 'inventoryCategories', inventoryCates)
      },
      async createInventoryCategory({name}) {
        await cms.getModel(COMMIT_COL).commit([{
          type: 'inventoryCategory',
          action: 'create',
          data: {
            name
          }
        }])
      },
      async updateInventoryCategory({name}) {
        await cms.getModel(COMMIT_COL).commit([{
          type: 'inventoryCategory',
          action: 'update',
          data: {
            _id,
            name
          }
        }])
      },
      async deleteInventoryCategory({_id}) {
        await cms.getModel(COMMIT_COL).commit([{
          type: 'inventoryCategory',
          action: 'delete',
          data: {
            _id
          }
        }])
      },
      
      // inventory
      async loadInventories() {
        const inventories = await cms.getModel(INVENTORY_COL).find({})
        this.$set(this, 'inventories', inventories)
        this.inventoriesLoadTimestamp = new Date().getTime()
      },
      async loadInventoryUnits() {
        const inventoryUnits = await cms.getModel(INVENTORY_UNIT_COL).find({})
        this.$set(this, 'inventoryUnits', inventoryUnits)
      },
      async createInventory({name, stock, categoryId, unit, lowStockThreshold}) {
        await cms.getModel(COMMIT_COL).commit([{
          type: 'inventory',
          action: 'create',
          data: {
            name,
            stock,
            categoryId,
            unit,
            lowStockThreshold,
            by: this.user._id
          }
        }])
      },
      async updateInventory({ _id, name, categoryId, unit, lowStockThreshold }) {
        await cms.getModel(COMMIT_COL).commit([{
          type: 'inventory',
          action: 'update',
          data: {
            _id,
            name,
            categoryId,
            unit,
            lowStockThreshold, /* notification will be send to an user if stock < lowStockThreshold */
            by: this.user._id
          }
        }])
      },
      async deleteInventory({_id}) {
        await cms.getModel(COMMIT_COL).commit([{
          type: 'inventory',
          action: 'delete',
          data: {
            _id,
            by: this.user._id
          }
        }])
      },
      
      // import inventory
      async addLowStockItemsToImportList() {
        const lowStockItems = []
        for(let inventory of this.inventories) {
          if (this.importingInventories.indexOf(t => t._id === inventory._id) < 0 && inventory.stock < 1) {
            lowStockItems.push({...inventory, added: 0})
          }
        }
        this.$set(this, 'importingInventories', [...this.importingInventories, ...lowStockItems])
      },
      async importNewStock() {
        // TODO: Check this.user._id again
        const updateData = [{
          type: 'inventory',
          action: 'import',
          data: {
            inventories: this.importingInventories.map(i => ({
              inventory: i._id,
              added: i.added
            })),
            inventoriesLoadTimestamp: this.inventoriesLoadTimestamp,
            timestamp: new Date(),
            by: this.user._id
          }
        }]
        await cms.getModel(COMMIT_COL).commit(updateData)
      },
      
      //
      async removeFilter(filter) {
        const index = this.inventoryFilters.findIndex(f => f.title === filter.title);
        this.inventoryFilters.splice(index, 1);
        await this.applyFilter()
      },
      updatePagination() {
      
      }
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.methods, this),
        ...getProvided(this.$options.computed, this),
      }
    }
  }
</script>
<style scoped>
</style>
