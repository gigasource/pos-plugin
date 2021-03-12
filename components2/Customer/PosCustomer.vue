<script>
import { execGenScopeId, genScopeId } from '../utils';
import _ from 'lodash';
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router';
import { isIOS } from '../AppSharedStates';
import {
  selectingCustomer,
  onOpenDialog,
  onRemoveSelectingCustomer,
  showCustomerDialog,
  onDialogSubmit,
  onSelectCustomer,
  customerDialogData,
  onRemoveAddress,
  autocompleteAddresses,
  debounceSearchAddress,
  onAddAddress,
  selectAutocompleteAddress,
  resetAddress
} from './customer-ui-logics-shared';
import { customers } from './customer-logic';
import { loadCustomers } from './customer-be-logics';
import { useI18n } from 'vue-i18n';

export default {
  setup() {

    //fixme: current problem: address text field
    const { t } = useI18n()
    onMounted(async () => {
      await loadCustomers()
    })
    const router = useRouter()
    const showSortMenu = ref(false)
    const showDeleteDialog = ref(false)
    const sortField = ref('')
    const sortedCustomer = computed(() => {
      return _.sortBy(customers.value, sortField.value)
    })

    function changeSortField(field) {
      sortField.value = field
      showSortMenu.value = false
    }

    function back() {
      router.go(-1)
    }

    const renderCustomers = () =>
        <div class="customer-main">
          <g-table striped fixed-header>
            {genScopeId(() =>
                <>
                  <tr>
                    <th class="sticky"> {t('customer.name')} </th>
                    <th class="sticky"> {t('customer.phone')} </th>
                    <th class="sticky"> {t('customer.address')} </th>
                    <th class="sticky"> {t('customer.spending')} </th>
                  </tr>
                  {sortedCustomer.value.map((customer, i) =>
                      <tr key={i} onClick={() => onSelectCustomer(customer)} class={[selectingCustomer.value && selectingCustomer.value._id === customer._id && 'bordered']}>
                        <td> {customer.name} </td>
                        <td> {customer.phone} </td>
                        <td>
                          {customer.addresses.map((item, index) =>
                              <p key={`address_${i}_${index}`}> {item.address} </p>
                          )}
                        </td>
                        <td> {customer.spending} </td>
                      </tr>
                  )}
                </>)()}
          </g-table>
        </div>

    const renderToolbar = () =>
        <g-toolbar class="customer-toolbar" color="grey lighten 3">
          {execGenScopeId(() => <>
            <g-btn-bs icon="icon-back@20" background-color="white" class="elevation-2" onClick={back}>
              {t('ui.back')}
            </g-btn-bs>
            <g-menu v-model={showSortMenu.value} top v-slots={{
              default: genScopeId(() =>
                  <div class="bg-white">
                    <g-btn-bs block onClick={() => changeSortField('name')}>
                      {t('customer.name')}
                    </g-btn-bs>
                    <g-btn-bs block onClick={() => changeSortField('phone')}>
                      {t('customer.phone')}
                    </g-btn-bs>
                  </div>)
              ,
              activator: genScopeId(({ on }) =>
                  <g-btn-bs onClick={on.click} icon="icon-sort@20" background-color="white" class="elevation-2">
                    {t('ui.sort')}
                  </g-btn-bs>)
            }}/>
            <g-spacer/>
            <g-btn-bs background-color="#1271FF" text-color="#FFFFFF" class="elevation-2" onClick={() => onOpenDialog('add')}>
              <g-icon size="20" color="white" class="mr-2">add_circle</g-icon>
              {t('ui.add')}
            </g-btn-bs>
            <g-btn-bs disabled={!selectingCustomer.value} icon="icon-cancel3@20" background-color="white" text-color="#FF4552" class="elevation-2" onClick={() => showDeleteDialog.value = true}>
              {t('ui.delete')}
            </g-btn-bs>
            <g-btn-bs disabled={!selectingCustomer.value} icon="icon-reservation_modify@20" background-color="#F9A825" class="elevation-2" onClick={() => onOpenDialog('edit')}>
              {t('ui.edit')}
            </g-btn-bs>
          </>)}
        </g-toolbar>


    function renderCustomerInfo() {
      return <div class="dialog-left">
        <div class="row-flex">
          <g-text-field required={true} virtualEvent={isIOS.value} outlined style="flex: 1" label={t('customer.name')} v-model={customerDialogData.name}/>
          <g-text-field required={true} virtualEvent={isIOS.value} outlined style="flex: 1" label={t('customer.phone')}
                        v-model={customerDialogData.phone}/>
        </div>

        {
          customerDialogData.addresses.map((address, i) =>
              <div class="row-flex flex-wrap justify-around mt-4 r">
                <div class="btn-delete" onClick={() => onRemoveAddress(address)}>
                  <g-icon>
                    icon-cancel3
                  </g-icon>
                </div>
                <div class="row-flex">
                  <g-combobox label={`Address ${i + 1}`}
                              key={`${customerDialogData.phone}_address_${i}`}
                              v-model={autocompleteAddresses.value[i].model}
                              clearable
                              skip-search
                              keep-menu-on-blur
                              searchText={address.address}
                              class="col-8" menu-class="menu-autocomplete-address"
                              items={autocompleteAddresses.value[i].places}
                              onUpdate:searchText={text => debounceSearchAddress(text, i)}
                              onUpdate:modelValue={val => selectAutocompleteAddress(val, i)}
                              virtualEvent={isIOS.value} outlined
                              onClear={() => resetAddress(i)}
                  />
                  <g-text-field label={`House ${i + 1}`} key={`${customerDialogData.phone}_house_${i}`} v-model={address.house} virtualEvent={isIOS.value} outlined/>
                </div>
                <div class="row-flex">
                  <g-text-field label={`Street ${i + 1}`} key={`${customerDialogData.phone}_street_${i}`} v-model={address.street} virtualEvent={isIOS.value} outlined/>
                  <g-text-field label={`Zipcode ${i + 1}`} key={`${customerDialogData.phone}_zipcode_${i}`} v-model={address.zipcode} virtualEvent={isIOS.value} outlined/>
                  <g-text-field label={`City ${i + 1}`} key={`${customerDialogData.phone}_city_${i}`} v-model={address.city} virtualEvent={isIOS.value} outlined/>
                </div>
              </div>
          )
        }
        <g-icon color="#1271FF" size="40" style="margin: 8px calc(50% - 20px)" onClick={onAddAddress}>
          add_circle
        </g-icon>
      </div>
    }

    return genScopeId(() =>
        <div class="customer">
          {renderCustomers()}
          {renderToolbar()}
          <dialog-confirm-delete v-model={showDeleteDialog.value} type=" customer " label={selectingCustomer.value && selectingCustomer.value.name} onSubmit={onRemoveSelectingCustomer}/>
          <g-dialog fullscreen v-model={showCustomerDialog.value}>
            {genScopeId(() => <div class="dialog">
              {renderCustomerInfo()}
              <div class="dialog-keyboard">
                <div style="flex: 1" onClick={() => showCustomerDialog.value = false}/>
                <div class="keyboard-wrapper">
                  <pos-keyboard-full type="alpha-number" onEnterPressed={onDialogSubmit}/>
                </div>
              </div>
            </div>)()}
          </g-dialog>
        </div>
    )
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

  &-toolbar {
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

.dialog {
  width: 100%;
  background: rgba(21, 21, 21, 0.42);
  display: flex;

  &-left {
    flex: 0 0 45%;
    background-color: white;
    padding: 4px;
    overflow: auto;

    ::v-deep .g-tf-wrapper {
      margin: 4px 2px 4px;
      width: auto;

      fieldset {
        border-width: 1px !important;
        border-color: #9e9e9e;
      }

      &.g-tf__focused fieldset {
        border-color: #1271FF;
      }

      .g-tf-input {
        font-size: 14px;
        padding: 4px;
      }

      .g-tf-label {
        font-size: 14px;
        top: 4px;

        &__active {
          transform: translateY(-13px) translateX(7px) scale(0.75) !important;
        }
      }
    }
  }

  &-keyboard {
    flex: 0 0 55%;
    display: flex;
    flex-direction: column;

    .keyboard-wrapper {
      padding: 4px;
      background-color: #f0f0f0;
    }
  }
}
</style>
