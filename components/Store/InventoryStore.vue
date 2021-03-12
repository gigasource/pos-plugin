<template>

</template>
<script>
  import { getProvided } from '../logic/commonUtils';
  import _ from 'lodash';

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
      genObjectId(id) {
        const BSON = require('bson');
        return new BSON.ObjectID(id);
      },
      // category
      async loadInventoryCategories() {
        console.log('InventoryStore:loadInventoryCategories')
        this.inventoryCategories = await cms.getModel(INVENTORY_CATEGORY_COL).find({})
      },
      async loadCategoriesWithItem() {
        const categories = await cms.getModel(INVENTORY_CATEGORY_COL).find()
        for (const category of categories) {
          const items = await cms.getModel(INVENTORY_COL).find({category: category._id.toString()})
          category.available = items.length === 0
        }
        return categories
      },
      async updateInventoryCategory(categories) {
        for(const category of categories) {
          const oldCate = this.inventoryCategories.find(c => c._id === category._id)
          if(oldCate) {
            if(category.name && category.name.trim() && oldCate.name !== category.name) {
              await cms.getModel(INVENTORY_CATEGORY_COL).findOneAndUpdate({_id: this.genObjectId(oldCate._id)}, {name: category.name})
            }
          } else {
            if(category.name && category.name.trim())
              await cms.getModel(INVENTORY_CATEGORY_COL).create(category)
          }
        }
        await this.loadInventoryCategories()
      },
      async deleteInventoryCategory(_id) {
        await cms.getModel(INVENTORY_CATEGORY_COL).deleteOne({_id: this.genObjectId(_id)})
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
        const histories = _.map(
            (_.groupBy(await cms.getModel(INVENTORY_HISTORY_COL).find(condition), item => item.inventory)),
            group => ({inventory: group[0].inventory, history: group}))
            .filter(item => item.inventory)
            .map(item => ({
              inventory: item.inventory,
              add: this.getTotalAmount(item.history, 'add'),
              remove: this.getTotalAmount(item.history, 'remove'),
            }))
        const inventories = await cms.getModel('Inventory').find()
        return histories.filter(item => !!inventories.find(i => i._id.toString() === item.inventory))
                        .map(item => ({
                            ...item,
                            ...inventories.find(i => i._id.toString() === item.inventory)
                          }))
      },
      // inventory
      async loadInventories(filters = []) {
        const condition = filters.reduce((acc, filter) => ({...acc, ...filter['condition']}), {});
        const inventories = await cms.getModel(INVENTORY_COL).find(condition);
        const categories = await cms.getModel(INVENTORY_CATEGORY_COL).find();
        this.inventories = inventories.map(item => ({
          ...item,
          category: categories.find(cate => cate._id.toString() === item.category)
        }))
        this.inventoriesLoadTimestamp = new Date().getTime()
      },
      async loadInventoryUnits() {
        this.inventoryUnits = await cms.getModel(INVENTORY_UNIT_COL).find({})
      },
      async createInventory(inventory) {
        const inventories = await cms.getModel(INVENTORY_COL).find()
        const ids = _.map(inventories, i => i.id)
        let id = 0
        do { id++ }
        while(_.includes(ids, id.toString()))
        const newInventory = await cms.getModel(INVENTORY_COL).create({...inventory, id, lastUpdateTimestamp: new Date()})
        const history = {
          inventory: newInventory._id.toString(),
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
            { _id: this.genObjectId(_id) },
            {
              name, category, unit, stock, lowStockThreshold, lastUpdateTimestamp: new Date()
            }
        )
        cms.socket.emit('changeInventory')
      },
      async deleteInventory(ids) {
        ids = ids.map(id => this.genObjectId(id))
        const inventories = await cms.getModel(INVENTORY_COL).find({_id: {$in: ids}})
        const result = await cms.getModel(INVENTORY_COL).deleteMany({_id: {$in: ids}})
        if(result.n === ids.length) {
          const histories = inventories.map(i => ({
            inventory: i._id.toString(),
            category: i.category,
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
        this.importingInventories = [...this.importingInventories, ...lowStockItems]
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
