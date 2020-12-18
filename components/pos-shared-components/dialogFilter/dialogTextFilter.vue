<template>
	<g-dialog v-model="internalValue" width="90%" :eager="!isIOS" :fullscreen="isMobile">
		<div class="wrapper">
			<g-icon @click="internalValue = false" svg size="20" class="icon">icon-close</g-icon>
			<div class="screen">
				<pos-text-field v-model="screenValue" large :label="label" readOnly ref="textfield" :virtual-event="isIOS"/>
				<div v-if="!isMobile" class="buttons">
					<g-btn :uppercase="false" text @click="internalValue = false" outlined width="120" class="mr-2">
						{{$t('ui.cancel')}}
					</g-btn>
					<g-btn :uppercase="false" text @click="submit" backgroundColor="#2979FF" text-color="#FFFFFF" width="120">
						{{$t('ui.ok')}}
					</g-btn>
				</div>
			</div>
			<div class="keyboard">
				<pos-keyboard-full v-model="screenValue" @enter-pressed="submit"/>
			</div>
		</div>
	</g-dialog>
</template>

<script>
  import { nextTick } from 'vue';

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
		injectService: ['PosStore:(isMobile, isIOS)'],
    data() {
      return {
        screenValue: ''
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue || false
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
    },
    methods: {
      async submit() {
        this.$emit('submit', this.screenValue);
        this.internalValue = false;
      },
    },
		watch: {
			internalValue: function(val) {
				if(val) {
					this.screenValue = this.defaultValue;
					nextTick(() => {
						setTimeout(() => {
							this.$refs['textfield'].onFocus()
						}, 200)
					})
				}
			}
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
