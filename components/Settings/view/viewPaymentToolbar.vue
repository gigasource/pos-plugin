<template>
  <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" class="mr-3"
         :disabled="!selectedPayment || !selectedPayment.editable" @click="openDialogEditPayment">
    <g-icon class="mr-2" color="red">
      edit
    </g-icon>
    {{$t('ui.edit')}}
  </g-btn>
  <g-btn :uppercase="false" background-color="white" class="mr-3" :disabled="!selectedPayment" text-color="#1d1d26"
         @click="openDialogDelete">
    <g-icon class="mr-2" svg>
      icon-trash
    </g-icon>
    {{$t('ui.delete')}}
  </g-btn>
  <g-btn :uppercase="false" background-color="#4CAF50" text-color="#FFFFFF" @click="openDialogNewPayment">
    + {{$t('settings.createPayment')}}
  </g-btn>
  <dialog-confirm-delete type="payment" :label="selectedPayment ? selectedPayment.name : ''"
                         v-model="dialogConfirmDelete" @submit="deletePayment"/>
  <dialog-new-payment ref="dialog"/>
</template>

<script>
  export default {
    name: 'viewPaymentToolbar',
    injectService: [
      'SettingsStore:selectedPayment',
      'SettingsStore:updatePayment'
    ],
    data() {
      return {
        dialogConfirmDelete: false,
        selectedPayment: null
      }
    },
    methods: {
      openDialogNewPayment() {
        this.$refs.dialog.open(false)
      },
      openDialogEditPayment() {
        this.$refs.dialog.open(true)
      },
      openDialogDelete() {
        this.dialogConfirmDelete = true;
      },
      async deletePayment() {
        await this.updatePayment(this.selectedPayment);
        this.selectedPayment = null;
      },
      updatePayment() {}
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
