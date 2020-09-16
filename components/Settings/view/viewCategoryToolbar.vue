<template>
	<fragment>
		<g-btn :uppercase="false" background-color="white" text-color="#1d1d26" :disabled="isMoveBtnDisabled(selectedCategory)" class="mr-3" @click="moveCategory('down')">
			<g-icon class="mr-2" svg size="18">
				icon-move-down
			</g-icon>
			{{$t('settings.moveDown')}}
		</g-btn>
		<g-btn :uppercase="false" background-color="white" text-color="#1d1d26" :disabled="isMoveBtnDisabled(selectedCategory, true)" class="mr-3" @click="moveCategory('up')">
			<g-icon class="mr-2" svg size="18">
				icon-move-up
			</g-icon>
			{{$t('settings.moveUp')}}
		</g-btn>
		<g-btn :uppercase="false" background-color="white" text-color="#1d1d26" :disabled="isBtnDisabled(selectedCategory)" class="mr-3" @click="openDialogEditCategory">
			<g-icon class="mr-2" color="red">
				edit
			</g-icon>
			{{$t('ui.edit')}}
		</g-btn>
		<g-btn :uppercase="false" background-color="white" text-color="#1d1d26" :disabled="isBtnDisabled(selectedCategory, true)" class="mr-3" @click="openDialogDelete">
			<g-icon class="mr-2" svg>
				icon-trash
			</g-icon>
			{{$t('ui.delete')}}
		</g-btn>
		<g-btn :uppercase="false" background-color="green" text-color="white" @click="openDialogNewCategory">
			+ {{$t('settings.createCategory')}}
		</g-btn>
		<dialog-confirm-delete type="Category" :label="selectedCategory ? selectedCategory.name : ''" v-model="dialogConfirmDelete" @submit="deleteCategory"/>
	</fragment>
</template>

<script>
	export default {
    name: 'viewCategoryToolbar',
		injectService: [
      'SettingsStore:selectedCategory',
      'SettingsStore:updateCategory',
      'SettingsStore:swapCategoryPosition',
      'SettingsStore:listCategories',
    ],
		data() {
    	return {
    		dialogConfirmDelete: false
			}
		},
    methods: {
			async moveCategory(direction) {
				if(!this.selectedCategory) return
				await this.swapCategoryPosition(direction)
			},
      openDialogNewCategory() {
        this.$getService('dialogNewCategory:open')(true, this.listCategories.length)
      },
			openDialogDelete() {
      	this.dialogConfirmDelete = true;
			},
      async deleteCategory() {
        await this.updateCategory(this.selectedCategory._id);
        this.selectedCategory = null;
      },
      openDialogEditCategory() {
        this.$getService('dialogNewCategory:open')()
      },
			back() {
				this.$router.push({ path: '/pos-dashboard' })
			},
			isMoveBtnDisabled(category, moveUp = false) {
				if (!category) return true

				const index = this.listCategories.indexOf(category)
				return moveUp ? index === 0 : index === this.listCategories.length - 1;
			},
			isBtnDisabled(category, isDelete = false) {
				if (!category) return true
				if (isDelete) return category.name === 'Favourite'
			}
    }
  }
</script>

<style scoped lang="scss">
	@media screen and (max-width: 1023px) {
		.g-btn {
			::v-deep .g-btn__content {
				font-size: 12px;
			}
		}
	}
</style>
