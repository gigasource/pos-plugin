<template>
  <fragment>
<!--    <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" class="mr-3">-->
<!--      <g-icon class="mr-2" svg>-->
<!--        icon-menu-->
<!--      </g-icon>-->
<!--      More-->
<!--    </g-btn>-->
    <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" class="mr-3" @click="dialogSort = true">
      <g-icon class="mr-2" svg>
        icon-sort
      </g-icon>
      {{$t('ui.sort')}}
    </g-btn>
    <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" class="mr-3" @click="openDialogEditProduct" :disabled="selectedProductIDs.length === 0">
      <g-icon class="mr-2" color="red">
        edit
      </g-icon>
      {{$t('ui.edit')}}
    </g-btn>
    <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" @click="openDialogDelete" class="mr-3" :disabled="selectedProductIDs.length === 0">
      <g-icon class="mr-2" svg>
        icon-trash
      </g-icon>
      {{$t('ui.delete')}}
    </g-btn>
    <g-btn :uppercase="false" background-color="green" text-color="white" @click="openDialogNewProduct">
      + {{$t('settings.createProduct')}}
    </g-btn>
    <dialog-confirm-delete :type="`${selectedProductIDs.length} ${$t('settings.createProduct')}`" v-model="dialogConfirmDelete" @submit="deleteProducts"/>
    <dialog-sort v-model="dialogSort" @submit="sort"/>
  </fragment>
</template>

<script>
  export default {
    name: 'viewArticleToolbar',
    injectService: [
        'SettingsStore:selectedProductIDs',
        'SettingsStore:deleteSelectedProducts',
        'SettingsStore:productSortCondition',
        'SettingsStore:getListProducts',
    ],
    data() {
      return {
        dialogConfirmDelete: false,
        dialogSort: false,
      }
    },
    methods: {
      async openDialogEditProduct() {
        await this.$getService('dialogNewProduct:open')(true);
      },
      async openDialogNewProduct() {
        await this.$getService('dialogNewProduct:open')(false);
      },
      openDialogDelete() {
        this.dialogConfirmDelete = true;
      },
      async deleteProducts() {
        await this.deleteSelectedProducts();
      },
      back() {
        this.$router.push({ path: '/pos-dashboard' });
      },
      async sort(option) {
        this.productSortCondition = option
        await this.getListProducts()
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
