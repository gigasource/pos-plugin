<template>
	<g-dialog v-model="dialogNewCategory" width="90%" eager>
		<div class="dialog-payment w-100">
			<div class="form">
				<p class="ml-1 mb-3">
					{{ isNewCategory ? 'Create New' : 'Edit' }}
					{{$t('article.category')}}
				</p>
				<pos-text-field style="width: 268px" label="Name" placeholder="Category name" v-model="name"/>
				<div class="row-flex justify-end py-5">
					<g-btn :uppercase="false" outlined class="mr-3" width="120" @click="dialogNewCategory = false">
						{{$t('ui.cancel')}}
					</g-btn>
					<g-btn :uppercase="false" flat background-color="blue accent 3" width="120" text-color="white" :disabled="!name" @click="save">
						{{$t('ui.ok')}}
					</g-btn>
				</div>
			</div>
			<div class="keyboard-wrapper">
				<pos-keyboard-full v-model="name"/>
			</div>
		</div>
	</g-dialog>
</template>

<script>
  export default {
    name: 'dialogNewCategory',
    injectService: [
      'SettingsStore:selectedCategory',
      'SettingsStore:updateCategory',
    ],
    data() {
      return {
        name: '',
				isNewCategory: false,
				internalValue: false,
				position: 0,
      }
    },
    props: {
      value: Boolean,
    },
    computed: {
      dialogNewCategory: {
        get() {
          return this.internalValue;
        },
        set(val) {
          this.internalValue = val;
        }
      },
    },
    methods: {
    	open(isNew = false, position = 0) {
    		this.isNewCategory = isNew;

    		if (this.isNewCategory) {
					this.name = ''
					this.position = position
				} else {
					this.name = this.selectedCategory && this.selectedCategory.name
				}
    		this.dialogNewCategory = true;
			},
      async save() {
        if (this.name) {
          let oldID;
          if (!this.isNewCategory && this.selectedCategory) oldID = this.selectedCategory._id;
          await this.updateCategory(oldID, this.name, this.position);
        }
        this.name = '';
        this.selectedCategory = null;
        this.dialogNewCategory = false;
      },
    }
  }
</script>

<style scoped lang="scss">
	.dialog-payment {
		background-color: white;
		display: flex;
		flex-direction: column;

		.form {
			padding: 32px 16px 0;
			color: #1d1d26;
			font-weight: 700;

			.g-btn__outlined {
				border: 1px solid #979797;
				color: #1d1d26;
			}
		}

		::v-deep .keyboard-wrapper {
			padding: 16px;
			background-color: #BDBDBD;
		}
	}

</style>
