<template>
	<g-dialog v-model="dialogNewPayment" fullscreen eager>
		<div class="dialog-payment w-100">
			<div class="form" @click="showKeyboard = false">
				<p class="ml-1 mb-3">{{ isEditPayment && selectedPayment
					? $t('settings.editPayment')
					: $t('settings.createPayment')  }}
				</p>
				<pos-text-field style="width: 268px" label="Name" placeholder="Payment name" @click.stop="showKeyboard = !showKeyboard" v-model="name"/>
				<pos-file-input-image label="Icon" v-model="src"/>
			</div>
			<div v-if="showKeyboard" class="keyboard-wrapper">
				<pos-keyboard-full v-model="name"/>
			</div>
			<g-toolbar bottom color="grey lighten 3">
				<g-btn :uppercase="false" background-color="white" text-color="#1d1d26" class="ma-3" @click="back">
					<g-icon class="mr-2" svg>
						icon-back
					</g-icon>
					{{$t('ui.back')}}
				</g-btn>
				<g-spacer/>
				<g-btn :uppercase="false" background-color="blue accent 3" text-color="white" class="ma-2" @click="save">
					{{$t('ui.save')}}
				</g-btn>
			</g-toolbar>
		</div>
	</g-dialog>
</template>

<script>
  export default {
    name: 'dialogNewPayment',
		injectService: [
			'SettingsStore:selectedPayment',
			'SettingsStore:updatePayment',
		],
    data() {
      return {
				name: '',
				src: null,
				isEditPayment: false,
				internalValue: false,
				showKeyboard: false
      }
    },
    props: {
      value: Boolean,
    },
    computed: {
      dialogNewPayment: {
        get() {
          return this.internalValue;
        },
        set(val) {
          this.internalValue = val;
        }
      },
    },
		methods: {
    	open(isEdit) {
    		this.isEditPayment = isEdit;
				if (this.isEditPayment && this.selectedPayment) {
					this.name = this.selectedPayment.name;
					this.src = this.selectedPayment.icon;
				} else {
					this.name = '';
					this.src = '';
				}
    		this.dialogNewPayment = true;
			},
    	resetData() {
				this.name = '';
				this.src = '';
				this.selectedPayment = null;
				this.isEditPayment = false;
			},
			back() {
    		this.resetData();
				this.dialogNewPayment = false;
			},
			async save() {
				if(this.name) {
					const payment = {
						name: this.name.toLowerCase(),
						icon: this.src,
					}
					let oldPayment;
					if(this.isEditPayment) oldPayment = this.selectedPayment;
					await this.updatePayment(oldPayment, payment);
				}
				this.back();
			},
		},
  }
</script>

<style scoped lang="scss">
	.dialog-payment {
		background-color: white;
		display: flex;
		flex-direction: column;
		height: calc(100% - 64px);
		overflow: auto;

		.form {
			padding: 32px 32px 0;
			color: #1d1d26;
			font-weight: 700;

			.g-switch-wrapper {
				margin-top: 24px;

				::v-deep .g-switch-label {
					font-size: 13px;
					line-height: 16px;
					font-weight: 400;
				}
			}

		}

		::v-deep .keyboard-wrapper {
			position: absolute;
			bottom: 64px;
			min-height: 30%;
			width: 100%;
			padding: 16px;
			background-color: #BDBDBD;
		}
	}

</style>
