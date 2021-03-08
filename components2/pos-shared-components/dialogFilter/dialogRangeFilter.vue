<script>
import { execGenScopeId, genScopeId, internalValueFactory } from '../../utils';
import { useI18n } from 'vue-i18n';
import { isMobile } from '../../AppSharedStates';
import { ref, watch } from 'vue'

export default {
  props: {
    label: null,
    min: {
      type: [Number, String],
      default: 0
    },
    max: {
      type: [Number, String],
      default: 500
    },
    modelValue: null,
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const internalValue = internalValueFactory(props, { emit })
    const filter = ref([0, 0])

    function submit() {
      emit('submit', filter.value);
      internalValue.value = false;
    }

    watch(() => internalValue.value, () => {
      filter.value = [0, 0]
    })
    return genScopeId(() => <>
          <g-dialog v-model={internalValue.value} width="70%" eager fullscreen={isMobile.value}>
            {execGenScopeId(() => <div class="wrapper">
              <div class="header">
                <span>
                  {props.label} </span>
                <g-icon onClick={() => internalValue.value = false} size="20" svg>
                  icon-close
                </g-icon>
              </div>
              <div>
                <pos-range-slider min={props.min} max={props.max} v-model={filter.value}></pos-range-slider>
                <div class="range-value">
                  <span>
                    {props.min === 0 ? props.min : '€ ' + props.min} </span>
                  <span>
                    {t('common.currency', locale.value)} {props.max} </span>
                </div>
              </div>
              <g-spacer></g-spacer>
              <div class="buttons">
                <g-btn uppercase={false} text onClick={() => internalValue.value = false} outlined width="120" style="margin-right: 8px">
                  {t('ui.cancel')} </g-btn>
                <g-btn uppercase={false} text onClick={submit} background-color="#2979FF" text-color="#FFFFFF" width="120">
                  {t('ui.ok')} </g-btn>
              </div>
            </div>)}
          </g-dialog>
        </>
    )
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 16px 48px 30px;
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
}

.range-value {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 30px;
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px;

  .g-btn__outlined {
    border: 1px solid #979797;
    color: #1d1d26;
  }
}
</style>
