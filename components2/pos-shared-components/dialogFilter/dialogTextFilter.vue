<script>
  import { nextTick, ref, watch } from 'vue';
  import { isIOS, isMobile } from '../../AppSharedStates'
  import { useI18n } from 'vue-i18n'
  import {internalValueFactory, genScopeId } from "../../utils";

  export default {
    name: 'dialogTextFilter',
    props: {
      label: null,
      modelValue: null,
			defaultValue: {
      	type: String,
				default: ''
			},
    },
    emits: ['update:modelValue', 'submit'],
    setup(props, { emit }) {
      const { t } = useI18n()

      const screenValue = ref('')
      const textField = ref(null)
      const internalValue = internalValueFactory(props, { emit })

      watch(() => internalValue.value, (newVal) => {
        if (newVal) {
          screenValue.value = props.defaultValue
          nextTick(() => {
            setTimeout(() => {
              textField._rawValue.onFocus()
            }, 200)
          })
        }
      })

      const submit = function () {
        emit('submit', screenValue.value)
        internalValue.value = false
      }

      return genScopeId(() => (
          <g-dialog v-model={internalValue.value} width="90%" eager={!isIOS.value} fullscreen={isMobile.value}>
            {genScopeId(() => (
              <div class="wrapper">
                <g-icon onClick={() => internalValue.value = false} svg size="20" class="icon">icon-close</g-icon>
                  <div class="screen">
                    <g-text-field-bs class="bs-tf__pos" v-model={screenValue.value} large label="label" ref={textField} virtual-event={isIOS.value}/>
                    {
                      isMobile.value &&
                      <div class="buttons">
                        <g-btn uppercase="false" text onClick={() => internalValue.value = false} outlined width="120" class="mr-2">
                          {t('ui.cancel')}
                        </g-btn>
                        <g-btn uppercase="false" text onClick={submit} backgroundColor="#2979FF" text-color="#FFFFFF" width="120">
                          {t('ui.ok')}
                        </g-btn>
                      </div>
                    }
                  </div>
                  <div class="keyboard">
                    <pos-keyboard-full v-model={screenValue.value} onEnterPressed={submit}/>
                  </div>
              </div>
            ))()}
          </g-dialog>
      ))
    }
	}
</script>

<style scoped lang="scss">
	.wrapper {
		background-color: #FFFFFF;
		padding: 16px;
		width: 100%;
		overflow: scroll;
		display: flex;
		flex-direction: column;
		position: relative;

		.icon {
			position: absolute;
			top: 16px;
			right: 16px;
		}

		.screen {
			flex: 1;
		}
	}

	.bs-tf-wrapper {
		width: 50%;

		::v-deep .bs-tf-label {
			margin-bottom: 16px;
			font-size: 16px;
			line-height: 20px;
			font-weight: 700;
			color: #1d1d26;
		}

		::v-deep .bs-tf-input--fake-caret {
			left: 12px;
			right: 12px;
		}
	}

	.buttons {
		height: 96px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0 4px;

		.g-btn__outlined {
			border: 1px solid #979797;
			color: #1d1d26;
		}
	}

	.keyboard {
		background-color: #BDBDBD;
		padding: 16px;
		margin: 0 -16px -16px -16px;
	}

	@media screen and (max-width: 1023px) {
		.bs-tf-wrapper {
			width: 100%;
		}
	}
</style>
