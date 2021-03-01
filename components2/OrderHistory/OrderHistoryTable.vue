<script>
import { genScopeId } from '../utils';
import { onBeforeMount } from 'vue'
import {
  clearFilters,
  filters,
  getOrderHistory,
  getOrderPayment,
  getStaffName,
  onSelectOrder,
  openDialog,
  orders,
  pagination,
  removeFilter,
  selectingOrder,
  totalOrders,
  updateCurrentPage,
  updateLimit,
  updatePagination
} from './order-history-logics';
import { $filters } from '../AppSharedStates';
import { useI18n } from 'vue-i18n';

export default {
  emits: [],
  setup() {
    const { t } = useI18n()

    //todo: for test only
    onBeforeMount(() => {
      getOrderHistory()
    })

    const renderHeader = () => <thead>
    <tr>
      <th class="ta-center" onClick={() => openDialog('number')}>
        {t('orderHistory.orderNo')}
        <g-icon size="12"> mdi-magnify</g-icon>
      </th>
      <th onClick={() => openDialog('datetime')}>
        {t('common.datetime')}
        <g-icon size="12"> mdi-filter</g-icon>
      </th>
      <th class="ta-center" onClick={() => openDialog('type')}>
        {t('orderHistory.type')}
        <g-icon size="12"> mdi-magnify</g-icon>
      </th>
      <th class="ta-left" onClick={() => openDialog('table')}>
        {t('orderHistory.tableNo')}
        <g-icon size="12"> mdi-filter</g-icon>
      </th>
      <th class="ta-right" onClick={() => openDialog('amount')}>
        {t('orderHistory.amount')}
        <g-icon size="12"> mdi-filter</g-icon>
      </th>
      <th class="ta-center" onClick={() => openDialog('payment')}>
        Payment
        <g-icon size="12"> mdi-filter </g-icon>
      </th>
      <th class="ta-left" onClick={() => openDialog('staff')}>
        {t('orderHistory.staff')}
        <g-icon size="12"> mdi-magnify</g-icon>
      </th>
    </tr>
    </thead>


    const renderFilters = () => (filters.value && filters.value.length || null) &&
        <tr>
          <td colspan="7" class="td__sticky">
            <div class="filter-list">
              <span class="ml-1"> {t('orderHistory.filter')} </span>
              <div class="group-chip">
                {filters.value.map(filter =>
                    <g-chip key={filter.title} label small background-color="white" close class="ma-1" onClose={() => removeFilter(filter)}>
                      <div>
                        <span class="chip-title">
                          {filter.title}:
                        </span>
                        <span class="chip-content">
                          {filter.text}
                        </span>
                      </div>
                    </g-chip>
                )}
              </div>
              <g-spacer/>
              <g-btn uppercase={false} text x-small background-color="white" height="24" onClick={clearFilters}>
                <g-icon svg size="16">
                  icon-cancel3
                </g-icon>
              </g-btn>
            </div>
          </td>
        </tr>

    const renderOrder = (order, idx) =>
        <tr key={idx}
            class={[order._id === selectingOrder.value._id && 'tr__active', order.status === 'cancelled' && 'cancelled']}
            onClick={() => onSelectOrder(order)}>
          <td>
            <div class="ta-center" style="white-space: nowrap; position: relative">
              {order.id}
              <g-tooltip openOnHover={true} color="#616161" transition="0.3" bottom speech-bubble remove-content-on-close v-slots={{
                'default': () => <span>
                  <b> From: </b>
                  {order.forwardedStore}
                </span>
                ,
                'activator': genScopeId(() => order.forwardedStore &&
                    <div v-on="on" class="tooltip-forward">
                      <g-icon size="16">
                        icon-delivery-forward
                      </g-icon>
                    </div>)
              }}>
              </g-tooltip>
            </div>
          </td>
          <td class="ta-center"> {order.dateTime} </td>
          <td class="ta-center" style="white-space: nowrap; text-transform: capitalize">
            {
              (order.type === 'delivery') &&
              <g-icon> icon-delivery-scooter </g-icon>
            }
            {
              (order.type === 'pickup') &&
              <g-icon> icon-take-away </g-icon>
            }
            {
              (!order.type) && <g-icon> icon-cutlery </g-icon>
            }
            <span> {order.type || 'Dine-in'} </span>
          </td>
          <td class="ta-left">
            {order.table || ''}
          </td>
          <td class="ta-right sum" style="white-space: nowrap">
            { $filters.formatCurrency(order.amount) }
          </td>
          <td class="ta-center">
            {
              (getOrderPayment(order).icon) &&
              (getOrderPayment(order).multi ?
                      <g-icon size="24" class="mr-2"> {getOrderPayment(order).icon} </g-icon>
                      :
                      <img alt src={getOrderPayment(order).icon} style="width: 24px;" class="mr-2"/>
              )
            }
          </td>
          <td>
            <p class="staff-name">
              {getStaffName(order.staff, order)}
            </p>
          </td>
        </tr>

    const renderPagination = () =>
        <pos-table-pagination onExecquerybypage={updatePagination}
                              totalDocument={totalOrders.value}
                              limit={pagination.limit}
                              onUpdate:limit={updateLimit}
                              currentPage={pagination.currentPage}
                              onUpdate:currentPage={updateCurrentPage}
        />

    return genScopeId(() =>
        <div style="height: 100%">
          <g-simple-table striped fixed-header>
            {genScopeId(() => <>
              {renderHeader()}
              {renderFilters()}
              {orders.value.map(renderOrder)}
            </>)()}
          </g-simple-table>
          {renderPagination()}
        </div>
    )
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

  tr th {
    color: #1271ff !important;
    cursor: pointer;
    padding: 0 8px;
    background-color: white;
    font-weight: 700;
    white-space: nowrap;
  }


  .cancelled {
    color: #555;

    .sum {
      text-decoration: line-through;
    }
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
    z-index: 2;
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

.tooltip-forward {
  position: absolute;
  left: 0;
  top: -2px
}

@media screen and (max-width: 1023px) {
  .g-table {
    height: calc(100% - 52px);

    tr {
      th {
        font-size: 10px;
        white-space: unset;
        padding: 0 4px;
      }

      td {
        font-size: 11px;
      }
    }
  }

  .tooltip-forward {
    position: static;
  }
}
</style>
