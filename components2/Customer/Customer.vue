<script>
import { onActivated, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { customers } from './customer-logic-ui'
import { dialog, selectedCustomer } from './customer-logic-shared'
import { useRouter } from 'vue-router'
import { execGenScopeId, genScopeId } from '../utils'
import dialogConfirmDelete from './dialog/dialogConfirmDelete'
import dialogCustomer from './dialog/dialogCustomer'
import { loadCustomers } from './customer-logic-be'

export default {
  name: 'Customer',
  components: [dialogConfirmDelete, dialogCustomer],
  setup() {

    const sort = ref('')
    const menuSort = ref(false)

    const { t } = useI18n()

    const router = useRouter()

    const back = function () {
      router.go(-1)
    }

    const clearDialog = function () {
      dialog.value = {
        edit: false,
        delete: false
      }
    }

    onMounted(async () => {
      await loadCustomers()
    })

    onActivated(() => {
      clearDialog()
    })

    const openDialogAdd = function () {
      selectedCustomer.value = {
        name: '',
        phone: '',
        addresses: [{
          address: '',
          house: '',
          zipcode: '',
          street: '',
          city: '',
        }]
      }
      dialog.value.edit = true
    }

    const openDialogEdit = function () {
      dialog.value.edit = true
    }

    const renderTable = function () {
      return (
          <div class="customer-main">
            <g-table striped fixed-header>
              {
                execGenScopeId(() => <>
                  <tr>
                    <th class="sticky">{t('onlineOrder.refundDialog.name')}</th>
                    <th class="sticky">{t('onlineOrder.refundDialog.phone')}</th>
                    <th class="sticky">{t('onlineOrder.refundDialog.address')}</th>
                  </tr>
                  {
                    customers.value.map((customer, i) => (
                        <tr key={i} onClick={() => selectedCustomer.value = customer}
                            class={selectedCustomer.value && selectedCustomer.value._id === customer._id && 'bordered'}>
                          <td>{customer.name}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.addresses.map(({ address }, _i) =>
                              <p key={`address_${i}_${_i}`}>{address}</p>)}</td>
                        </tr>
                    ))
                  }
                </>)
              }
            </g-table>
          </div>
      )
    }

    const changeSort = (sort) => {
      sort.value = sort
      menuSort.value = false
    }

    const renderToolbar = () => (
        <g-toolbar class="customer-toolbar" color="grey lighten 3">
          {
            execGenScopeId(() => <>
              <g-btn-bs icon="icon-back@20" background-color="white" class="elevation-2" onClick={back}>
                {t('ui.back')}
              </g-btn-bs>
              <g-menu v-model={menuSort.value}>
                <template v-slots={{
                  default: () => execGenScopeId(() => (
                      <div class="bg-white">
                        <g-btn-bs block onClick={() => changeSort('name')}>Name</g-btn-bs>
                        <g-btn-bs block onClick={() => changeSort('phone')}>Phone</g-btn-bs>
                      </div>
                  )),
                  activator: ({ on }) => execGenScopeId(() =>
                      <g-btn-bs onClick={on.click} icon="icon-sort@20" background-color="white" class="elevation-2">{t('ui.sort')}</g-btn-bs>
                  )
                }}/>
              </g-menu>
              <g-spacer/>
              <g-btn-bs background-color="#1271FF" text-color="#FFFFFF" class="elevation-2"
                        onClick={openDialogAdd}>
                <g-icon size="20" color="white" class="mr-2">add_circle</g-icon>
                {t('ui.add')}
              </g-btn-bs>
              <g-btn-bs disabled={!selectedCustomer.value} icon="icon-cancel3@20"
                        background-color="white" text-color="#FF4552" class="elevation-2"
                        onClick={() => { /* todo: fill this */
                        }}>
                {t('ui.delete')}
              </g-btn-bs>
              <g-btn-bs disabled={!selectedCustomer.value} icon="icon-reservation_modify@20"
                        background-color="#F9A825" class="elevation-2" onClick={openDialogEdit}>
                {t('ui.edit')}
              </g-btn-bs>
            </>)
          }
        </g-toolbar>
    )

    return genScopeId(() => (
        <div class="customer">
          {renderTable()}
          {renderToolbar()}
          <dialog-confirm-delete/>
          <dialog-customer v-model={dialog.value.edit}
                           selectedCustomer={selectedCustomer.value}/>
        </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.customer {
  height: 100vh;

  &-main {
    height: calc(100% - 64px);
    overflow: scroll;

    .g-table ::v-deep {
      th {
        text-align: left;
        color: #1271FF;
        font-size: 14px;
        border-bottom: 1px solid #979797;
      }

      th:nth-child(1), td:nth-child(1),
      th:nth-child(2), td:nth-child(2) {
        width: 25%;
      }

      .bordered {
        box-shadow: 0 0 4px rgba(18, 113, 255, 0.563019);

        td {
          border-top: 2px solid #1271ff;
          border-bottom: 2px solid #1271ff;
        }

        td:first-child {
          border-left: 2px solid #1271ff;
          padding-left: 14px;
        }

        td:last-child {
          border-right: 2px solid #1271ff;
          padding-right: 14px;
        }
      }
    }
  }

  ::v-deep &-toolbar {
    .g-btn-bs {
      font-size: 14px;
    }
  }

  .sticky {
    position: sticky;
    top: -1px;
    background: white
  }
}

.btn-delete {
  position: absolute;
  top: -25px;
  right: 0;
  background-color: white;
  border: 1px solid #ff4452;
  border-radius: 2px;
}
</style>
