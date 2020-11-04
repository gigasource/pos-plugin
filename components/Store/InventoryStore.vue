<template>

</template>
<script>
  import { getProvided } from '../logic/commonUtils';
  import _ from 'lodash'

  const INVENTORY_COL = 'Inventory'
  const INVENTORY_CATEGORY_COL = 'InventoryCategory'
  const INVENTORY_UNIT_COL = 'InventoryUnit'
  const INVENTORY_HISTORY_COL = 'InventoryHistory'
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
        selectedInventoryIDs: [],
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
      async loadCategoriesWithItem() {
        const categories = await cms.getModel(INVENTORY_CATEGORY_COL).aggregate([
          {
            $lookup: {
              from: 'inventories',
              localField: '_id',
              foreignField: 'category',
              as: 'items'
            }
          }
        ])
        return categories.map(c => ({...c, available: c.items.length === 0}))
      },
      async updateInventoryCategory(categories) {
        for(const category of categories) {
          const oldCate = this.inventoryCategories.find(c => c._id === category._id)
          if(oldCate) {
            if(oldCate.name !== category.name) {
              await cms.getModel(INVENTORY_CATEGORY_COL).findOneAndUpdate({_id: oldCate._id}, {name: category.name})
            }
          } else {
            if(category.name && category.name.trim())
              await cms.getModel(INVENTORY_CATEGORY_COL).create(category)
          }
        }
        await this.loadInventoryCategories()
      },
      async deleteInventoryCategory(_id) {
        await cms.getModel(INVENTORY_CATEGORY_COL).deleteOne({_id})
      },
      getTotalAmount(items, mode) {
        return items.reduce((acc, item) => {
          if(mode === item.type) {
            return acc + item.amount
          }
          return acc
        }, 0)
      },
      async loadInventoriesWithChange(filter) {
        let condition = {}
        if(filter.category) {
          Object.assign(condition, { category: filter.category })
        }
        if(filter.date) {
          const fromDate = dayjs(filter.date.fromDate).startOf('day').toDate(), toDate = dayjs(filter.date.toDate).endOf('day').toDate()
          Object.assign(condition, { date : { $gte: fromDate, $lte: toDate }})
        }
        // aggregate match can find category
        // const inventories = await cms.getModel('InventoryHistory').aggregate([
        //   {
        //     $match: condition
        //   },
        //   {
        //     $group: {
        //       _id: '$inventory',
        //       history: { $push: '$$ROOT' }
        //     }
        //   },
        //   {
        //     $lookup: {
        //       from: 'inventories',
        //       localField: '_id',
        //       foreignField: '_id',
        //       as: 'inventory'
        //     }
        //   },
        //   {
        //     $unwind: '$inventory'
        //   }
        // ])
        return _.map(
            (_.groupBy(await cms.getModel(INVENTORY_HISTORY_COL).find(condition), item => item.inventory && item.inventory._id)),
            group => ({inventory: group[0].inventory, history: group}))
            .filter(item => item.inventory)
            .map(item => ({
              ...item.inventory,
              add: this.getTotalAmount(item.history, 'add'),
              remove: this.getTotalAmount(item.history, 'remove'),
            }))
      },
      // inventory
      async loadInventories() {
        const condition = this.inventoryFilters.reduce((acc, filter) => ({...acc, ...filter['condition']}), {});
        this.inventories = await cms.getModel(INVENTORY_COL).find(condition);
        this.inventoriesLoadTimestamp = new Date().getTime()
      },
      async loadInventoryUnits() {
        const inventoryUnits = await cms.getModel(INVENTORY_UNIT_COL).find({})
        this.$set(this, 'inventoryUnits', inventoryUnits)
      },
      async createInventory(inventory) {
        const inventories = await cms.getModel(INVENTORY_COL).find()
        const ids = _.map(inventories, i => i.id)
        let id = 0
        do { id++ }
        while(_.includes(ids, id.toString()))
        const newInventory = await cms.getModel(INVENTORY_COL).create({...inventory, id, lastUpdateTimestamp: new Date()})
        const history = {
          inventory: newInventory._id,
          category: newInventory.category,
          type: 'add',
          amount: newInventory.stock,
          date: new Date(),
          reason: 'Create new inventory',
        }
        await this.updateInventoryHistory(history)
      },
      async updateInventory({ _id, name, category, unit, stock, lowStockThreshold }) {
        await cms.getModel(INVENTORY_COL).findOneAndUpdate(
            { _id },
            {
              name, category, unit, stock, lowStockThreshold, lastUpdateTimestamp: new Date()
            }
        )
        cms.socket.emit('changeInventory')
      },
      async deleteInventory(ids) {
        const inventories = await cms.getModel(INVENTORY_COL).find({_id: {$in: ids}})
        const result = await cms.getModel(INVENTORY_COL).deleteMany({_id: {$in: ids}})
        if(result.n === ids.length) {
          const histories = inventories.map(i => ({
            inventory: i._id,
            category: i.category._id,
            type: 'remove',
            amount: i.stock,
            date: new Date(),
            reason: 'Remove inventory',
          }))
          await this.updateInventoryHistory(histories)
        }
        cms.socket.emit('changeInventory')
      },
      async updateInventoryHistory(history) {
        await cms.getModel(INVENTORY_HISTORY_COL).create(history)
      },
      async loadInventoryHistory(_id, dateFilter) {
        const condition = { inventory: _id }
        if(dateFilter) {
          const fromDate = dayjs(dateFilter.fromDate).startOf('day').toDate(), toDate = dayjs(dateFilter.toDate).endOf('day').toDate()
          Object.assign(condition, { date : { $gte: fromDate, $lte: toDate }})
        }
        return await cms.getModel(INVENTORY_HISTORY_COL).find(condition).sort({date: -1})
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
        this.inventoryPagination.currentPage = 1;
        await this.loadInventories();
      },
      async clearFilter() {
        this.inventoryFilters = [];
        this.inventoryPagination.currentPage = 1;
        await this.loadInventories();
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
