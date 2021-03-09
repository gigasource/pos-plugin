<script>
import { onBeforeMount, withModifiers } from 'vue';
import { ref } from 'vue'
import { useI18n } from 'vue-i18n';
import { genScopeId } from '../utils';
import { showNotify } from '../AppSharedStates'
export default {
  setup() {
    const { t } = useI18n()
    const delivery = ref(null)
    const pickup = ref(null)
    const note = ref('')
    const dialog = ref({
      text: false
    })
    onBeforeMount(() => {
      getServices()
    })
    function save() {
      showNotify('Saving...')
      cms.socket.emit('updateOnlineDeviceServices', {
        // deliveryOffTime: this.delivery ? newDate.add(this.deliveryTimer, 'hour').toDate() : null,
        // pickupOffTime: this.pickup ? newDate.add(this.pickupTimer, 'hour').toDate() : null,
        // noteOffTime: newDate.add(this.offTimer, 'hour').toDate()
        delivery: delivery.value,
        pickup: pickup.value,
        noteToCustomers: note.value,
      }, async({ error }) => {
        if (error) {
          showNotify(error)
          const posSetting = await cms.getModel('PosSetting').findOne()
          const { delivery: _d, pickup: _p, noteToCustomers: _n } = posSetting.onlineDevice.services
          delivery.value = _d
          pickup.value = _p
          note.value = _n || ''
        } else {
          showNotify('Settings Saved!')
        }
      })
    }
    function getServices() {
      cms.socket.emit('getOnlineDeviceServices', ({ services, error }) => {
        if (error) {
          showNotify(error)
        }
        const { delivery: _d, pickup: _p, noteToCustomers: _n } = services
        delivery.value = _d
        pickup.value = _p
        note.value = _n || ''
      })
    }
    function changeNote(val) {
      note.value = val
    }
    return genScopeId(() =>
        <div class="online-order-services">
          <div class="row-flex">
            <div class="online-order-services__item">
              <g-switch v-model={delivery.value} label={t('onlineOrder.delivery')}></g-switch>
            </div>
            <div class="online-order-services__item">
              <g-switch v-model={pickup.value} label={t('onlineOrder.pickup')}></g-switch>
            </div>
          </div>
          <div class="online-order-services__item">
            <div class="online-order-services__title">
              {t('onlineOrder.noteToCustomer')} </div>
            <div class="online-order-services__content">
              <g-textarea v-model={note.value} no-resize outlined rows="5" placeholder={`${t('onlineOrder.note')}...`} onClick={() => dialog.value.text = true}></g-textarea>
            </div>
          </div>
          <div class="row-flex">
            <g-spacer></g-spacer>
            <g-btn-bs background-color="#536DFE" style="margin: 0; width: 96px;" text-color="white" onClick={withModifiers(save, ['stop'])}>
              {t('onlineOrder.save')} </g-btn-bs>
          </div>
          <dialog-blogtext-input v-model={dialog.value.text} label="Note" defaultValue={note.value} onSubmit={changeNote}></dialog-blogtext-input>
        </div>
    )
  }
}
</script>

<style lang="scss" scoped>
.online-order-services {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  width: 100%;
  min-height: 100%;
  padding: 48px 36px;

  &__item {
    margin-bottom: 36px;
    flex: 0 0 50%;
  }

  &__title {
    font-weight: bold;
  }

  &__content {
    .radio-group {
      .g-radio-wrapper {
        margin: 8px 50px 8px 0
      }
    }

    .g-select {
      margin-left: 8px;

      ::v-deep .bs-tf-wrapper {
        width: 108px;
        margin: 4px 5px 4px;

        .bs-tf-inner-input-group {
          border-color: #979797;
          border-radius: 1px;
          background: white;
          padding-right: 4px;
        }
      }
    }

    .g-textarea {
      margin: 8px 0;

      ::v-deep fieldset {
        border-color: #efefef;
        border-width: 1px;
        background: white;

        textarea {
          padding: 12px 16px;
        }
      }
    }
  }
}

@media screen and (max-width: 1023px) {
  .online-order-services {
    padding: 24px 18px;
  }
}
</style>
