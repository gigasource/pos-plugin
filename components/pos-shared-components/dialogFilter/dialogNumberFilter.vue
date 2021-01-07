<template>
	<g-dialog v-model="internalValue" width="50%" :eager="!isIOS"  :fullscreen="isMobile">
		<div class="wrapper">
			<g-icon @click="internalValue = false" svg size="20" class="icon">icon-close</g-icon>
			<div class="screen">
				<g-text-field-bs class="bs-tf__pos" v-model="screenValue" large :label="label" :rules="rules" readOnly :virtual-event="isIOS"/>
				<div class="buttons">
					<g-btn :uppercase="false" text @click="internalValue = false" outlined width="120" class="mr-2">
						{{$t('ui.cancel')}}
					</g-btn>
					<g-btn :uppercase="false" text @click="submit" backgroundColor="#2979FF" text-color="#FFFFFF" width="120">
						{{$t('ui.ok')}}
					</g-btn>
				</div>
			</div>
			<div class="keyboard">
				<pos-numpad v-model="screenValue"/>
			</div>
		</div>
	</g-dialog>
</template>

<script>
	import PosNumpad from '../PosNumpad';
	
  export default {
    name: 'dialogNumberFilter',
		components: {PosNumpad},
    props: {
      label: null,
      modelValue: null,
			rules: Array,
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
    	internalValue: function() {
    		this.screenValue = ''
			}
		}
  }
</script>

<style scoped lang="scss">
	.wrapper {
		width: 100%;
		background-color: #FFFFFF;
		padding: 16px;
		overflow: scroll;
		position: relative;
		display: flex;
		flex-direction: column;

		.icon {
			position: absolute;
			top: 16px;
			right: 16px;
		}

		.screen {
			flex: 1;
			padding-bottom: 16px;
		}
	}

	.bs-tf-wrapper {
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
		margin-top: 24px;
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
		padding: 20px 125px;
		margin: 0 -16px -16px -16px;

		.keyboard__template {
			height: 100%;
		}
	}
</style>
