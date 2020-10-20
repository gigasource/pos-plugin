<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <g-simple-table striped fixed-header style="flex: 1">
      <thead>
      <tr>
        <th class="ta-center">
          Inventory
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th>
          Name
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-center">
          Category
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th class="ta-left">
          Unit
        </th>
        <th class="ta-right">
          Stock
        </th>
      </tr>
      </thead>
      <!-- Filter row -->
      <tr v-if="inventoryFilters && inventoryFilters.length > 0">
        <td colspan="8" class="td__sticky">
          <div class="filter-list">
            <span class="ml-1">...</span>
            <div class="group-chip">
              <g-chip v-for="filter in inventoryFilters" :key="filter.title" label small background-color="white" close class="ma-1" @close="removeFilter(filter)">
                <div>
                  <span class="chip-title">{{filter.title}}: </span>
                  <span class="chip-content">{{filter.text}}</span>
                </div>
              </g-chip>
            </div>
            <g-spacer/>
            <g-btn :uppercase="false" text x-small background-color="white" height="24">
              <g-icon svg size="16">icon-cancel3</g-icon>
            </g-btn>
          </div>
        </td>
      </tr>
      <!-- Data row -->
      <tr v-for="(inventory, i) in inventories" :key="i">
        <td>{{inventory.id}}</td>
        <td class="ta-center">{{inventory.name}}</td>
        <td class="ta-center" style="white-space: nowrap; text-transform: capitalize">{{ inventory.category }}</td>
        <td class="ta-center">{{ inventory.unit }}</td>
        <td>{{ inventory.stock }}</td>
      </tr>
    </g-simple-table>
<!--    <pos-table-pagination @execQueryByPage="updatePagination"-->
<!--                          :total-document="totalInventories"-->
<!--                          :limit.sync="limit"-->
<!--                          :current-page.sync="currentPage"/>-->
    <div>
      <g-toolbar color="#eeeeee" elevation="0">
        <g-btn :uppercase="false" style="margin-right: 5px">
          <g-icon small style="margin-right: 5px">icon-back</g-icon>Back
        </g-btn>
        <g-btn :uppercase="false">
          <g-icon small style="margin-right: 5px">icon-inventory-report</g-icon>
          Report
        </g-btn>
        <g-spacer/>
        <g-btn :uppercase="false" style="margin-right: 5px">
          <g-icon small style="margin-right: 5px">icon-inventory-new-stock</g-icon>
          New stock
        </g-btn>
        <g-btn :uppercase="false" style="margin-right: 5px">
          <g-icon small style="margin-right: 5px">icon-inventory-category</g-icon>
          Category
        </g-btn>
        <g-btn :uppercase="false" style="margin-right: 5px">
          <g-icon small style="margin-right: 5px">icon-inventory-delete</g-icon>
          Delete
        </g-btn>
        <g-btn :uppercase="false" style="margin-right: 5px">
          <g-icon small style="margin-right: 5px">icon-inventory-edit</g-icon>
          Edit
        </g-btn>
        <g-btn :uppercase="false" background-color="#4CAF50" text-color="#FFF">
          + Create new inventory
        </g-btn>
      </g-toolbar>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'Inventory',
    injectService: ['InventoryStore:(inventories,inventoryFilters,selectedInventory,inventoryPagination,removeFilter,totalInventories)'],
    props: {},
    data: function () {
      return {
        inventories: [],
        
      }
    },
    computed: {
      limit: {
        get() {
          if(this.inventoryPagination)
            return this.inventoryPagination.limit;
          return 15
        },
        set(val) {
          this.inventoryPagination.limit = val;
        }
      },
      currentPage: {
        get() {
          if(this.inventoryPagination)
            return this.inventoryPagination.currentPage;
          return 1
        },
        set(val) {
          this.inventoryPagination.currentPage = val;
        }
      }
    },
    methods: {
      updatePagination() {
        // ...
      }
    }
  }
</script>
<style scoped>
</style>
