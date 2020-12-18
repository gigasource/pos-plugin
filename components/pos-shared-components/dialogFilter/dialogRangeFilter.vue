<template>
	<g-dialog v-model="internalValue" width="70%" eager :fullscreen="isMobile">
		<div class="wrapper">
			<div class="header">
				<span>{{label}}</span>
				<g-icon @click="internalValue = false" size="20" svg>icon-close</g-icon>
			</div>
			<div>
				<pos-range-slider :min="min" :max="max" v-model="filter"/>
				<div class="range-value">
					<span>{{min === 0 ? min : '€ ' + min}}</span>
					<span>{{$t('common.currency', storeLocale)}} {{max}}</span>
				</div>
			</div>
			<g-spacer/>
			<div class="buttons">
				<g-btn :uppercase="false" text @click="internalValue = false" outlined width="120" style="margin-right: 8px">{{$t('ui.cancel')}}</g-btn>
				<g-btn :uppercase="false" text @click="submit" backgroundColor="#2979FF" text-color="#FFFFFF" width="120">{{$t('ui.ok')}}</g-btn>
			</div>
		</div>
	</g-dialog>
</template>

<script>

  export default {
    name: 'dialogRangeFilter',
		injectService: ['PosStore:(storeLocale, isMobile)'],
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
    data() {
      return {
        filter: [0, 0]
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
      }
    },
    methods: {
      async submit() {
        this.$emit('submit', this.filter);
        this.internalValue = false;
      }
    },
		watch: {
			internalValue: function() {
				this.filter = [0, 0]
			}
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
