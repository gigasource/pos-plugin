<script>
  import { ref, computed } from 'vue'
  import { dialog } from '../customer-logic-shared'
  import { isIOS } from '../../AppSharedStates'
  import { genScopeId, execGenScopeId, internalValueFactory } from '../../utils'
  import { updateCustomer } from '../customer-logic-be'

  export default {
    name: 'dialogCustomer',
    props: {
      modelValue: Boolean,
      selectedCustomer: Object
    },
    setup(props, { emit }) {
      const internalValue = internalValueFactory(props, { emit })

      const closeDialogEdit = function () {
        internalValue.value = false
      }

      const doUpdateCustomer = function () {
        updateCustomer(props.selectedCustomer)
        closeDialogEdit()
      }

      return genScopeId(() => (
        <g-dialog fullscreen v-model={internalValue.value}>
          {
            execGenScopeId(() => <>
              <div class="dialog-overlay" onClick={() => internalValue.value = false}></div>
              <div class="dialog">
                <div class="dialog-left">
                  <div class="row-flex">
                    <g-text-field virtual-event={isIOS} outlined style="flex: 1" label="Name" v-model={props.selectedCustomer.name}/>
                    <g-text-field virtual-event={isIOS} outlined style="flex: 1" label="Phone" v-model={props.selectedCustomer.phone}/>
                  </div>
                  {
                    props.selectedCustomer.addresses && props.selectedCustomer.addresses.map((address, i) => (
                        <div class="row-flex flex-wrap justify-around mt-4 r">
                          <div class="row-flex">
                            <g-text-field label={`Address`} key={`street_${i}`}
                                          v-model={address.address} virtual-event={isIOS} outlined/>
                            <g-text-field label={`Zipcode`} key={`zipcode_${i}`} v-model={address.zipcode} virtual-event={isIOS} outlined/>
                            <g-text-field label={`City`} key={`city_${i}`} v-model={address.city} virtual-event={isIOS} outlined/>
                          </div>
                        </div>
                    ))
                  }
                </div>
                <div class="dialog-keyboard">
                  <div style="flex: 1" onClick={closeDialogEdit}/>
                  <div class="keyboard-wrapper">
                    <pos-keyboard-full type="alpha-number" onEnterPressed={doUpdateCustomer}/>
                  </div>
                </div>
              </div>
            </>)
          }
        </g-dialog>
      ))
    }
  }
</script>

<style scoped lang="scss">

.dialog {
  width: 100%;
  background: rgba(21, 21, 21, 0.42);
  display: flex;
  z-index: 1;

  &-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #21212121;
  }

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
