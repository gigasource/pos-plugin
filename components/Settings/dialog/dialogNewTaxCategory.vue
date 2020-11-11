<template>
  <g-dialog v-model="dialogNewTaxCategory" overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager :fullscreen="isMobile">
    <div class="dialog-new-tax w-100">
      <g-icon @click="dialogNewTaxCategory = false" svg size="20" class="icon">icon-close</g-icon>
      <div class="form">
        <div class="input">
          <pos-textfield-new @click="check = 'letter'" large label="Name" v-model="name" suffix="%"/>
          <pos-textfield-new @click="check = 'tax'" large :label="$t('common.tax')" v-model="tax" :rules="[rules.number, rules.range]" suffix="%"/>
          <pos-textfield-new @click="check = 'letter'" large label="Type" v-model="type"/>
        </div>
        <div v-if="!isMobile" class="action">
          <g-btn :uppercase="false" outlined class="mr-3" width="120" @click="dialogNewTaxCategory = false">{{$t('ui.cancel')}}</g-btn>
          <g-btn :uppercase="false" flat background-color="blue accent 3" text-color="white" width="120" @click="submit" :disabled="!valid">{{$t('ui.ok')}}</g-btn>
        </div>
      </div>
      <div class="bg-grey-lighten-1 pa-2">
        <pos-keyboard-full @enter-pressed="submit"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogNewTaxCategory',
    props: {
      value: null,
    },
    injectService: [
      'SettingsStore:selectedTaxCategory',
      'SettingsStore:updateTaxCategory',
      'PosStore:isMobile'
    ],
    data() {
      return {
        tax: '',
        name: '',
        type: '',
        check: 'tax',
        internalValue: false,
        isEdit: false,
        rules: {
          number: val => !isNaN(val) || 'Must be a number',
          range: val => isNaN(val) || (val <= 100 && val >= 0) || 'Tax Range: 0 - 100'
        }
      }
    },
    computed: {
      dialogNewTaxCategory: {
        get() {
          return this.internalValue;
        },
        set(val) {
          this.internalValue = val
        }
      },
      valid() {
        return !(!this.tax || !this.name || typeof this.rules.number(this.tax) === 'string' || typeof this.rules.range(this.tax) === 'string');
      }
    },
    methods: {
      async submit() {
        let taxCategory
        if (this.isEdit) {
          this.selectedTaxCategory.value = parseInt(this.tax);
          this.selectedTaxCategory.name = this.name;
          this.selectedTaxCategory.type = this.type;
          taxCategory = this.selectedTaxCategory
        } else {
          taxCategory = {
            value: parseInt(this.tax),
            name: this.name,
            type: this.type
          }
        }
        await this.updateTaxCategory(taxCategory._id, taxCategory);
        this.tax = '';
        this.name = '';
        this.type = '';
        this.dialogNewTaxCategory = false;
      },
      open(isEdit) {
        this.isEdit = isEdit
        if (isEdit && this.selectedTaxCategory) {
          this.tax = this.selectedTaxCategory.value.toString()
          this.name = this.selectedTaxCategory.name;
          this.type = this.selectedTaxCategory.type;
        } else {
          this.tax = '';
          this.name = '';
          this.type = '';
        }
        this.check = 'tax';
        this.dialogNewTaxCategory = true;
      }
    },
  }
</script>

<style scoped lang="scss">
  .dialog-new-tax {
    background-color: white;
    position: relative;
    display: flex;
    flex-direction: column;

    .form {
      margin-top: 16px;
      padding: 16px;
      flex: 1;

      .input {
        display: flex;
      }

      .action {
        display: flex;
        justify-content: flex-end;
        padding-top: 24px;
      }
    }

    .icon {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  }
</style>
