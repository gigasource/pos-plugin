<script>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n';

export default {
  name: 'dialogConfirmDelete',
  props: {
    modelValue: Boolean,
    type: String,
    label: [String, Number],
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const internalType = ref(null)
    const internalLabel = ref(null)
    const internalValue = ref(null)
    const dialog = computed({
      get() {
        return props.modelValue || internalValue.value
      },
      set(val) {
        if (!val) {
          internalType.value = null;
          internalLabel.value = null;
        }
        emit('update:modelValue', val);
        internalValue.value = val;
      }
    })

    const computedType = computed(() => {
      return props.type || internalType.value
    })

    const computedLabel = computed(() => {
      return props.label || internalLabel.value
    })

    function submit() {
      emit('submit');
      dialog.value = false;
    }

    function open(type, label) {
      internalType.value = type;
      internalLabel.value = label;
      dialog.value = true;
    }

    return () =>
      <g-dialog v-model={dialog.value} overlay-color="#6b6f82" overlay-opacity="0.95" width="40%" eager>
        <g-card class="w-100">
          <g-card-title>
            {t('ui.confirmation')}
          </g-card-title>
          <g-card-text>
            <span> {t('settings.deletePrompt')} </span>
            {
              (computedType.value) && <span> {computedType.value} </span>
            }
            {
              (computedLabel.value) && <b> "{computedLabel.value}" </b>
            }
            ?
          </g-card-text>
          <g-card-actions>
            <g-btn-bs border-color="#1d1d26" onClick={() => dialog.value = false}>
              {t('ui.cancel')} </g-btn-bs>
            <g-btn-bs background-color="red lighten 2" text-color="white" onClick={submit}>
              {t('ui.delete')} </g-btn-bs>
          </g-card-actions>
        </g-card>
      </g-dialog>
  }
}
</script>

<style scoped lang="scss">
.g-card {
  .g-card-title,
  .g-card-text {
    justify-content: center;
    text-align: center;
    color: #1d1d26;
  }

  .g-card-text {
    padding: 32px 64px;
  }

  .g-card-actions {
    justify-content: flex-end;

    .g-btn {
      min-width: 120px !important;
    }

    .g-btn__outlined {
      border: 1px solid #979797;
      color: #1d1d26;
    }
  }
}
</style>
