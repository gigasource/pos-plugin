<script>
import { ref, onCreated, computed, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { $filters } from '../AppSharedStates';

export default {
  name: "dialogChangeStock",
  props: {
    modelValue: Boolean,
    name: String,
    stock: Number,
    removable: {
      type: Boolean,
      default: true
    },
  },
  setup() {
    const { t } = useI18n()
    const change = ref(0)
    const mode = ref(!this.removable ? 'add' : '')
    const reason = ref('')
    const reasons = ref([t('inventory.expiredIngredient'), t('inventory.updateToMatch')])

    const internalValue = computed({
      get: () => {
        return this.modelValue
      },
      set: (val) => {
        if (!val) {
          mode.value = ''
          change.value = 0
          reason.value = ''
        }
        this.$emit('update:modelValue', val)
      }
    })
    const newStock = computed(() => {
      if (mode.value === 'add')
        return this.stock + change.value
      else if (mode.value === 'remove')
        return (this.stock - change.value) > 0 ? (this.stock - change.value) : 0
      else
        return this.stock
    })
    const rules = computed(() => {
      let rules = []
      if (mode.value === 'remove') {
        const stock = this.stock
        rules.push(val => +val <= stock || '')
      }
      return rules
    })

    watch(() => internalValue.value, (val) => {
      if (val) {
        mode.value = 'add'
        setTimeout(() => {
          this.$refs.textfield.$refs.input.focus()
        }, 200)
        window.addEventListener('keydown', withModifiers(handleEnter, ['stop']), false)
      } else {
        window.removeEventListener('keydown', withModifiers(handleEnter, ['stop']), false)
      }
    })

    const changeValue = function (val) {
      change.value = val
    }
    const submit = function () {
      if (mode.value === 'remove' && this.stock < change.value) return
      this.$emit('submit', {
        type: mode.value,
        change: change.value,
        value: newStock.value,
        reason: reason.value
      })
      internalValue.value = false
    }
    const handleEnter = function (event) {
      // event.stopPropagation()
      if (event.key === 'Enter') {
        submit()
      }
    }

    return () => <>
      <g-dialog v-model={internalValue.value}>
        <div class="dialog">
          <div class="dialog-title">
            {t('inventory.addRemoveStock')} </div>
          <g-icon size="16" class="dialog-icon--close" onClick={() => internalValue.value = false}>
            icon-close
          </g-icon>
          <div class="dialog-content">
            <p>
              <b>
                {t('inventory.item')}: </b>
              {name} </p>
            <p>
              <b>
                {t('inventory.currentStock')}: </b>
              {$filters.formatCurrency(this.stock)} </p>
            <p>
              <b>
                {t('inventory.newStock')}: </b>
              <span style={{ ...mode.value === 'add' && { color: '#1271FF' }, ...mode.value === 'remove' && { color: '#FF4452' } }}>
                {$filters.formatCurrency(newStock.value)} </span>
            </p>
            <div class="dialog-content__action">
              <div class={['btn', mode === 'add' && 'btn--blue']} onClick={() => mode.value = 'add'}>
                <g-icon color="white">
                  add
                </g-icon>
              </div>
              <div class={['btn', mode.value === 'remove' && 'btn--red', !this.removable && 'disabled']} onClick={() => mode.value = 'remove'}>
                <g-icon color="white">
                  remove
                </g-icon>
              </div>
              <g-text-field-bs ref={textfield} rules={rules.value} modelValue={change.value} onUpdate:modelValue={changeValue}>
              </g-text-field-bs>
            </div>
            {
              (mode.value === 'remove') ?
                  <g-select class="dialog-content__reason" text-field-component="GTextFieldBs" items={reasons.value} v-model={reason.value} placeholder="Reason (Optional)">
                  </g-select>
                  :

                  <div class="dialog-content__reason" style="height: 38px"></div>
            }
          </div>
          <div class="dialog-keyboard">
            <pos-keyboard-full width="100%" type="numeric" onEnterPressed={submit}>
            </pos-keyboard-full>
          </div>
        </div>
      </g-dialog>
    </>
  }
}
</script>

<style scoped lang="scss">
.dialog {
  width: 500px;
  margin-left: auto;
  margin-right: auto;
  background-color: white;
  padding: 16px;
  position: relative;
  overflow: auto;
  border-radius: 2px;

  &-title {
    font-size: 20px;
    line-height: 25px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &-icon--close {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  &-content {
    p {
      font-size: 16px;
      line-height: 20px;
      margin: 8px 0;
    }

    .btn {
      flex: 0 0 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #9e9e9e;
      border-radius: 4px;
      margin-right: 8px;

      &--blue {
        background-color: #1271FF;
      }

      &--red {
        background-color: #ff4552;
      }
    }

    .bs-tf-wrapper,
    .g-select ::v-deep .bs-tf-wrapper {
      margin: 0;
      width: 100%;

      ::v-deep input {
        outline: none;
      }
    }

    &__action {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    &__reason {
      margin-bottom: 8px;
    }
  }

  &-keyboard {
    background: #bdbdbd;
    padding: 4px;
    border-radius: 2px;
  }
}

@media screen and (max-height: 599px) {
  .dialog {
    width: 400px;
    padding: 12px;

    &-title {
      font-size: 18px;
      line-height: 22px;
    }

    &-content {

      p {
        font-size: 14px;
        line-height: 18px;
        margin: 4px 0;
      }

      &__action {
        margin-bottom: 4px;
      }

      &__reason {
        margin-bottom: 4px;
      }
    }

    &-keyboard {
      ::v-deep .key {
        font-size: 16px !important;
      }
    }
  }
}
</style>
