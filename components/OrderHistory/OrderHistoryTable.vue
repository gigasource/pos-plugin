<template>
  <div style="height: 100%">
    <g-simple-table striped fixed-header>
      <thead>
      <tr>
        <th class="ta-right" @click="openOrderNumberLookup">{{$t('orderHistory.orderNo')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th @click="openDateTimePicker">{{$t('common.datetime')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th @click="openBarcodeLookup">{{$t('orderHistory.barcode')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th class="ta-right" @click="openAmountFilter">{{$t('orderHistory.amount')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-left" @click="openStaffFilter">{{$t('orderHistory.staff')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th>{{$t('orderHistory.info')}}</th>
      </tr>
      </thead>
      <tr v-if="orderHistoryFilters && orderHistoryFilters.length > 0">
        <td colspan="6" class="td__sticky">
          <div class="filter-list">
            <span class="ml-1">{{$t('orderHistory.filter')}}</span>
            <div class="group-chip">
              <g-chip v-for="filter in orderHistoryFilters" :key="filter.title" label small background-color="white" close class="ma-1" @close="removeFilter(filter)">
                <div>
                  <span class="chip-title">{{filter.title}}: </span>
                  <span class="chip-content">{{filter.text}}</span>
                </div>
              </g-chip>
            </div>
            <g-spacer/>
            <g-btn :uppercase="false" text x-small background-color="white" height="24" @click="clearFilters">
              <g-icon svg size="16">icon-cancel3</g-icon>
            </g-btn>
          </div>
        </td>
      </tr>
      <tr v-for="(order, i) in orderHistoryOrders" :key="i" :class="[order._id === orderHistoryCurrentOrder._id && 'tr__active']" @click="chooseOrder(order)">
        <td class="ta-center" style="white-space: nowrap">{{order.id}}</td>
        <td class="ta-center">{{order.dateTime}}</td>
        <td class="ta-center" style="white-space: nowrap">{{order.barcode}}</td>
        <td class="ta-right" style="white-space: nowrap">€ {{order.amount.toFixed(2)}}</td>
        <td>
          <p class="staff-name">{{getStaffName(order.staff)}}</p>
        </td>
        <td class="ta-center">{{order.info}}</td>
      </tr>
    </g-simple-table>
    <pos-table-pagination @execQueryByPage="updatePagination"
                          :total-document="totalOrders"
                          :limit.sync="limit"
                          :current-page.sync="currentPage"/>
  </div>
</template>
<script>
  export default {
    name: 'OrderHistoryTable',
    props: {
      value: null,
    },
    injectService: [
      'OrderStore:(orderHistoryOrders,orderHistoryFilters,orderHistoryCurrentOrder,getOrderHistory,orderHistoryPagination,getTotalOrders,totalOrders)'
    ],
    computed: {
      limit: {
        get() {
          return this.orderHistoryPagination.limit;
        },
        set(val) {
          this.orderHistoryPagination.limit = val;
          this.getOrderHistory();
        }
      },
      currentPage: {
        get() {
          return this.orderHistoryPagination.currentPage;
        },
        set(val) {
          this.orderHistoryPagination.currentPage = val;
          this.getOrderHistory();
        }
      }
    },
/*    watch: {
      async limit() {
        await this.getOrderHistory();
      },
      async currentPage() {
        await this.getOrderHistory();
      }
    },*/
    methods: {
      openAmountFilter() {
        this.$getService('orderHistoryAmountFilter:setActive')(true)
      },
      openBarcodeLookup() {
        this.$getService('orderHistoryBarcodeLookup:setActive')(true)
      },
      openDateTimePicker() {
        this.$getService('orderHistoryDateTimePicker:setActive')(true)
      },
      openStaffFilter() {
        this.$getService('orderHistoryStaffFilter:setActive')(true)
      },
      openOrderNumberLookup() {
        this.$getService('orderHistoryOrderNumberLookup:setActive')(true)
      },
      chooseOrder(order) {
        this.orderHistoryCurrentOrder = order;
      },
      async removeFilter(filter) {
        const index = this.orderHistoryFilters.findIndex(f => f.title === filter.title);
        this.orderHistoryFilters.splice(index, 1);
        await this.getOrderHistory();
        await this.getTotalOrders();
      },
      async clearFilters() {
        this.orderHistoryFilters = [];
        await this.getOrderHistory();
        await this.getTotalOrders();
      },
      async updatePagination() {
        await this.getOrderHistory();
      },
      getStaffName(staffs) {
        return staffs.map(s => s.name).join(', ')
      }
    },
    async created() {
      await this.getOrderHistory();
      await this.getTotalOrders();
    },
    async activated() {
      await this.getOrderHistory();
      await this.getTotalOrders();
    }
  }
</script>

<style scoped lang="scss">
  .g-table {
    min-height: 0;
    height: calc(100% - 64px);

    ::v-deep .g-data-table__wrapper::-webkit-scrollbar {
      display: none;
    }

    ::v-deep table {
      table-layout: fixed;
    }

    thead tr th {
      color: #1271ff;
      cursor: pointer;
      padding: 0 8px;
      background-color: white;
      font-weight: 700;
      white-space: nowrap;
    }

    tr td {
      height: 33px;
      font-size: 13px;
      line-height: 16px;
      padding: 0 8px;
      border-top: 2px solid transparent;
      border-bottom: 2px solid transparent;

      .staff-name {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }

    .td__sticky {
      position: sticky;
      top: 48px;
      background-color: #bdbdbd;
    }

    .tr__active {
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

    tr th:nth-child(1) {
      width: 13%;
    }

    tr th:nth-child(2) {
      width: 14%;
    }

    tr th:nth-child(3) {
      width: 18%;
    }

    tr th:nth-child(4) {
      width: 13%;
    }

    tr th:nth-child(5) {
      width: 18%;
    }
  }

  .filter-list {
    display: flex;
    align-items: center;
    padding: 8px;
    font-size: 13px;
    line-height: 16px;
    font-weight: 700;

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
  }
</style>
