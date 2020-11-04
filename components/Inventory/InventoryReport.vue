<template>
  <div class="inventory-report">
    <div class="inventory-report__left">
      <div class="category">
        <div :class="['category-item', selectedCategory === 'all' && 'category-item--selected']" @click="selectCategory('all')">
          ALL
        </div>
        <div v-for="category in inventoryCategories" :key="category._id" @click="selectCategory(category)"
             :class="['category-item', selectedCategory === category && 'category-item--selected']">
          {{category.name}}
        </div>
      </div>
      <g-btn-bs block style="margin: 0" class="elevation-1" background-color="white"  icon="icon-back" @click="back">Back</g-btn-bs>
    </div>
    <div class="inventory-report__main">
      <div class="inventory-report__main-header">
        <g-text-field-bs v-model="searchText" clearable>
          <template v-slot:append-inner>
            <g-icon @click="dialog.text = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
        <g-menu v-model="menu" nudge-bottom="4">
          <template v-slot:activator="{on}">
            <div v-on="on" class="type">
              <g-icon :size="type === 'all' ? 24 : 16" class="mr-1">{{`icon-inventory-report-${type}`}}</g-icon>
              {{type === 'remove' ? 'Use / Remove' : type}}
            </div>
          </template>
          <div class="type-menu">
            <div class="type-menu-item" @click="type = 'all'">
              <g-icon class="mr-2">icon-inventory-report-all</g-icon>
              All
            </div>
            <div class="type-menu-item" @click="type = 'add'">
              <g-icon size="16" class="ml-1 mr-2">icon-inventory-report-add</g-icon>
              Add
            </div>
            <div class="type-menu-item" @click="type = 'remove'">
              <g-icon size="16" class="ml-1 mr-2">icon-inventory-report-remove</g-icon>
              Use / Remove
            </div>
          </div>
        </g-menu>
        <div class="display-btn">
          <div style="border-radius: 2px 0 0 2px; border-right: 1px solid #E3F2FD" :class="['display-btn-item', display === 'list' && 'display-btn--selected']" @click="display = 'list'">
            <g-icon size="20">icon-inventory-report-list</g-icon>
          </div>
          <div style="border-radius: 0 2px 2px 0" :class="['display-btn-item', display === 'grid' && 'display-btn--selected']" @click="display = 'grid'">
            <g-icon size="20">icon-inventory-report-grid</g-icon>
          </div>
        </div>
        <g-spacer/>
        <date-range-picker :from="dateFilter.fromDate" :to="dateFilter.toDate" @save="changeFilter"/>
      </div>
      <div :class="['inventory-report__main-content', display === 'grid' && 'inventory-report__main-content--grid']">
        <template v-if="display === 'list'">
          <div class="inventory-report-list-item" v-for="(inventory, i) in sortedInventories" :key="`list_${i}`" @click="selectItem(inventory)">
            <div class="inventory-report-list-item__name">{{inventory.name}}</div>
            <div class="inventory-report-list-item__unit">{{inventory.unit}}</div>
            <div class="inventory-report-list-item__add">
              <g-icon v-if="inventory.add || inventory.add === 0" size="12" style="margin-bottom: 2px">icon-inventory-report-add</g-icon>
              {{inventory.add | formatNumber}}
            </div>
            <div class="inventory-report-list-item__remove">
              <g-icon v-if="inventory.remove || inventory.remove === 0" size="14" class="mr-1">icon-inventory-report-remove</g-icon>
              {{inventory.remove | formatNumber}}
            </div>
          </div>
        </template>
        <template v-if="display === 'grid'">
          <div class="inventory-report-grid-item" v-for="(inventory, i) in sortedInventories" :key="`grid_${i}`" @click="selectItem(inventory)">
            <div class="inventory-report-grid-item__name">{{inventory.name}}</div>
            <div class="inventory-report-grid-item__detail">
              <div class="inventory-report-grid-item__add">
                <g-icon v-if="inventory.add || inventory.add === 0" size="12" style="margin-bottom: 2px">icon-inventory-report-add</g-icon>
                {{inventory.add | formatNumber}}
              </div>
              <g-spacer/>
              <div class="inventory-report-grid-item__remove">
                <g-icon v-if="inventory.remove || inventory.remove === 0" size="14" class="mr-1">icon-inventory-report-remove</g-icon>
                {{inventory.remove | formatNumber}}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <dialog-text-filter v-model="dialog.text" label="Search Item" @submit="val => {searchText = val}"/>

    <g-dialog v-if="selectedItem" v-model="dialog.detail" width="479" overlay-color="rgb(107, 111, 130)" overlay-opacity="0.7">
      <div class="dialog">
         <div class="dialog-header">
           <div class="dialog-header__title">
             <div class="fw-700 flex-grow-1">{{selectedItem.name}}</div>
             <div>Unit: ({{selectedItem.unit}})</div>
           </div>
           <div class="dialog-header__bar">
             <div class="col-4 pl-2">Date</div>
             <div class="col-2">Amount</div>
             <div class="col-6">Reason</div>
           </div>
         </div>
        <div v-for="(item, i) in selectedItem.history" class="dialog-history-item" :key="`history_${i}`">
          <div class="col-4 pl-2">{{item.date | formatDate}}</div>
          <div class="col-2">
            <g-icon size="12" style="margin-bottom: 2px">{{`icon-inventory-report-${item.type}`}}</g-icon>
            {{item.amount | formatNumber}}
          </div>
          <div class="col-6">{{item.reason}}</div>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "InventoryReport",
    injectService: ['InventoryStore:(inventoryCategories, loadInventoryCategories, loadInventoriesWithChange, loadInventoryHistory)'],
    filters: {
      formatDate(value) {
        return dayjs(value).format('DD/MM/YYYY HH:mm')
      },
      formatNumber(number) {
        return number && number.toFixed(2)
      }
    },
    data() {
      return {
        categories: [],
        selectedCategory: null,
        searchText: '',
        dateFilter: {
          fromDate: '',
          toDate: ''
        },
        dialog: {
          text: false,
          detail: false
        },
        menu: false,
        type: 'all',
        display: 'list',
        inventories: [],
        selectedItem: {
          name: '',
          unit: '',
          history: []
        },
      }
    },
    async created() {
      this.dateFilter.fromDate = dayjs().format('YYYY-MM-DD')
      this.dateFilter.toDate = dayjs().format('YYYY-MM-DD')
      this.selectedCategory = 'all'
      await this.loadInventoryCategories()
      await this.loadData()
    },
    async activated() {
      this.dateFilter.fromDate = dayjs().format('YYYY-MM-DD')
      this.dateFilter.toDate = dayjs().format('YYYY-MM-DD')
      this.selectedCategory = 'all'
      await this.loadInventoryCategories()
      await this.loadData()
    },
    computed: {
      sortedInventories() {
        let sorted = _.cloneDeep(this.inventories)
        if(this.searchText) {
          sorted = _.filter(sorted, item => item.name && item.name.toLowerCase().includes(this.searchText.toLowerCase()))
        }
        if (this.type === 'add') {
          sorted = _.map(sorted, item => _.omit(item, 'remove'))
        } else if (this.type === 'remove') {
          sorted = _.map(sorted, item => _.omit(item, 'add'))
        }
        return sorted
      }
    },
    methods: {
      back() {
        this.$router.push({
          path: '/pos-inventory'
        })
      },
      async loadData() {
        const filter = {
          category: this.selectedCategory._id ? this.selectedCategory._id : null,
          date: this.dateFilter
        }
        this.inventories = await this.loadInventoriesWithChange(filter)
      },
      async selectCategory(category) {
        if(this.selectedCategory === category) {
          this.selectedCategory = null
        } else {
          this.selectedCategory = category
        }
        await this.loadData()
      },
      async changeFilter(range) {
        this.dateFilter = range
        await this.loadData()
      },
      async selectItem(item){
        const history = await this.loadInventoryHistory(item._id, this.dateFilter)
        this.selectedItem = {
          ...item,
          history
        }
        this.dialog.detail = true
      }
    }
  }
</script>

<style scoped lang="scss">
  .inventory-report {
    display: flex;
    height: 100%;
    overflow: hidden;

    &__left {
      flex: 0 0 200px;
      display: flex;
      flex-direction: column;
      padding: 6px;
      background-color: #E1E3EB;

      .category {
        flex: 1;
        margin-bottom: 8px;
        overflow: auto;

        &-item {
          background-color: white;
          border-radius: 2px;
          padding: 8px;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;

          &--selected {
            background-color: #1271FF;
            color: white;
          }
        }
      }
    }

    &__main {
      flex: 1;
      height: 100%;
      overflow: auto;

      &-header {
        display: flex;
        align-items: center;
        padding: 6px;
        background-color: #bdbdbd;
        position: sticky;
        top: -1px;

        .bs-tf-wrapper {
          flex: 2;
          margin: 0;
          background-color: white;
          border-radius: 4px;
        }

        .display-btn {
          display: flex;
          border-radius: 2px;
          margin-left: 4px;

          &-item {
            height: 38px;
            width: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
          }

          &--selected {
            background-color: #E3F2FD;
          }
        }

        .date-range-picker {
          background-color: white;

          ::v-deep .value {
            height: 30px;
          }
        }
      }

      &-content {
        padding: 6px;
        overflow: auto;

        &--grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          grid-auto-rows: 1fr;
          grid-gap: 6px;
        }
      }
    }

    &-list-item {
      display: flex;
      align-items: center;
      height: 32px;
      padding: 8px;
      font-size: 13px;
      line-height: 16px;

      &:nth-child(2n+1) {
        background-color: white;
      }

      &:nth-child(2n+2) {
        background-color: #f2f2f2;
      }

      &__name {
        flex: 1;
      }

      &__unit, &__add, &__remove {
        flex: 0 0 10%;
        text-align: left;
      }

      &__add, &__remove {
        font-weight: 700;
      }
    }

    &-grid-item {
      padding: 8px;
      border-radius: 2px;
      font-size: 14px;

      &:nth-child(8n+1),
      &:nth-child(8n+2),
      &:nth-child(8n+3),
      &:nth-child(8n+4) {
        background-color: #EFEFEF;
      }

      &:nth-child(8n+5),
      &:nth-child(8n+6),
      &:nth-child(8n+7),
      &:nth-child(8n+8) {
        background-color: #E3F2FD;
      }

      &__name {
        word-break: break-word;
        -webkit-line-clamp: 2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      &__detail {
        display: flex;
        align-items: center;
        font-weight: 700;
      }

      &__add {
        color: #1271FF;
      }

      &__remove {
        color: #FF4452;
      }
    }
  }

  .type {
    background: white;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    width: 130px;
    height: 38px;
    text-transform: capitalize;
    font-size: 14px;

    &-menu {
      background-color: white;
      border-radius: 2px;

      &-item {
        display: flex;
        align-items: center;
        font-size: 14px;
        padding: 4px;
        border-bottom: 1px solid #e0e0e0;
      }
    }
  }

  .dialog {
    background-color: white;
    width: 100%;
    border-radius: 4px;
    overflow: auto;

    &-header {
      position: sticky;
      top: -1px;
      background-color: white;

      &__title {
        display: flex;
        align-items: center;
        padding: 8px;
      }

      &__bar {
        display: flex;
        align-items: center;
        background-color: #EFEFEF;
        border-top: 0.4px solid #9E9E9E;
        border-bottom: 0.4px solid #9E9E9E;
        padding: 8px 0;
        font-size: 12px;
        font-weight: 700;
        color: #757575;
      }
    }

    &-history-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;

      &:nth-child(2n+2) {
        background-color: #F8F8FB;
      }
    }
  }
</style>
