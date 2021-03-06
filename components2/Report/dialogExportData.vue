<script>
import { computed, ref } from 'vue'
import { execGenScopeId, genScopeId } from '../utils';
import dayjs from 'dayjs'

export default {
  name: 'dialogExportData',
  props: {
    modelValue: Boolean,
  },
  setup(props, { emit }) {
    // TODO: i18n?
    const type = ref('')
    const internalValue = computed({
      get() {
        return props.modelValue;
      },
      set(val) {
        emit('update:modelValue', val)
      }
    })
    // TODO: Date time format
    const datePickerDateFormat = 'YYYY-MM-DD'
    const fromDate = ref(dayjs().format(datePickerDateFormat))
    const toDate = ref(dayjs().format(datePickerDateFormat))
    const now = ref(dayjs().format(datePickerDateFormat))
    const saving = ref(false)

    return genScopeId(() => (
        <g-dialog v-model={internalValue} eager width="584">
          {execGenScopeId(() => (
              <div class="dialog">
                <div class="dialog-title">GDPdU/GoBD Data Exportieren</div>
                <g-icon class="dialog-icon--close" color="#757575" onClick={() => internalValue.value = false}>close</g-icon>
                <div class="dialog-content">
                  <div class="dialog-content__main">
                    <div class="dialog-content__title span-2">Type</div>
                    <div class={['dialog-content__type', type.value === 'GoDB' && 'dialog-content__type--selected']}
                         onClick={() => type.value = 'GoDB'}>GoDB</div>
                    <div class={['dialog-content__type', type.value === 'DSFINV' && 'dialog-content__type--selected']}
                         onClick={() => type.value = 'DSFINV'}>DSFINV</div>
                    <div class="dialog-content__title">Von</div>
                    <div class="dialog-content__title">Bis</div>
                    <g-date-picker-input max={toDate.value} class="dialog-content__date" no-title icon="" v-model={fromDate.value}/>
                    <g-date-picker-input min={fromDate.value} max={now.value} class="dialog-content__date" no-title icon="" v-model={toDate.value}/>
                    <div class="dialog-content__title span-2">Exportieren zu:</div>
                    {
                      (saving.value)
                          ? <g-btn-bs class="span-2" icon="icon-floppy-disk_white"
                                      background-color="#1271FF">Saving ... (Bitte warten)! </g-btn-bs>
                          : <g-btn-bs onClick={() => saving.value = true}
                                      icon="icon-floppy-disk" background-color="#F0F0F0" border-color="#C9C9C9"
                                      text-color="black">Local</g-btn-bs>
                    }
                  </div>
                  <img alt src="/plugins/pos-plugin/assets/image/GoBD.png"/>
                </div>
              </div>
          ))}
        </g-dialog>
    ))
  }
}
</script>

<style scoped lang="scss">
.dialog {
  width: 100%;
  background: white;
  border-radius: 4px;
  padding: 24px;
  position: relative;

  &-title {
    font-weight: 700;
    font-size: 20px;
    line-height: 25px;
    margin-bottom: 24px;
  }

  &-icon--close {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  &-content {
    display: flex;
    align-items: flex-start;

    &__main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 16px 40px 16px 40px 16px 40px;
      grid-gap: 8px;
      margin-right: 16px;

      .span-2 {
        grid-column: span 2;
      }

      .bs-tf-wrapper {
        margin: 0;
        width: 100%;

        ::v-deep .bs-tf-input-group {
          background-color: #F0F0F0;
          border-color: #C9C9C9;

          .bs-tf-input {
            background-color: #F0F0F0;
          }
        }
      }

      .g-btn-bs {
        margin: 0;
        font-size: 14px;
      }
    }

    &__title {
      font-size: 13px;
      font-weight: 700;
    }

    &__type {
      background: #EFEFEF;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;

      &--selected {
        background-color: #1271FF;
        color: white;
      }
    }

    &__date :deep {
      .g-tf-wrapper {
        border: 1px solid #c9c9c9;
        border-radius: 4px;
        background-color: #f0f0f0;
        color: #000;
        margin: 0;
        padding: 5px;

        &:before, &:after {
         background-color: #00000000;
        }


        :deep(fieldset) {
          border-color: #C9C9C9;
          border-radius: 2px;
        }

        :deep(.g-tf-label) {
          font-weight: bold;
          color: #1D1D26;
        }
      }
    }
  }
}
</style>
