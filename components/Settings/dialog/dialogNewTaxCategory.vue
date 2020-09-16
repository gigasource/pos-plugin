<template>
  <g-dialog v-model="dialogNewTaxCategory" overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager :fullscreen="isMobile">
    <div class="dialog-new-tax w-100">
      <g-icon @click="dialogNewTaxCategory = false" svg size="20" class="icon">icon-close</g-icon>
      <div class="form">
        <div class="input">
          <pos-textfield-new @click="check = 'tax'" large :label="$t('common.tax')" v-model="tax" :rules="[rules.number, rules.range]" suffix="%"/>
          <pos-textfield-new @click="check = 'letter'" large :label="$t('settings.invoiceLetter')" v-model="computedLetter"/>
        </div>
        <div v-if="!isMobile" class="action">
          <g-btn :uppercase="false" outlined class="mr-3" width="120" @click="dialogNewTaxCategory = false">{{$t('ui.cancel')}}</g-btn>
          <g-btn :uppercase="false" flat background-color="blue accent 3" text-color="white" width="120" @click="submit" :disabled="!valid">{{$t('ui.ok')}}</g-btn>
        </div>
      </div>
      <div class="bg-grey-lighten-1 pa-2">
        <pos-keyboard-full v-model="keyboard" @enter-pressed="submit"/>
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
        letter: '',
        check: 'tax',
        internalValue: false,
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
      computedLetter: {
        get() {
          return this.letter ? this.letter.toUpperCase() : '';
        },
        set(val) {
          this.letter = val.charAt(val.length - 1).toUpperCase();
        }
      },
      keyboard: {
        get() {
          if (this.check === 'tax') {
            return this.tax;
          } else if (this.check === 'letter') {
            return this.letter;
          }
        },
        set(val) {
          if (this.check === 'tax') {
            return this.tax = val;
          } else if (this.check === 'letter') {
            return this.computedLetter = val;
          }
        }
      },
      valid() {
        return !(!this.tax || !this.letter || typeof this.rules.number(this.tax) === 'string' || typeof this.rules.range(this.tax) === 'string');
      }
    },
    methods: {
      async submit() {
        if(this.selectedTaxCategory) {
          this.selectedTaxCategory.value = parseInt(this.tax);
          this.selectedTaxCategory.name = this.tax + '%';
          this.selectedTaxCategory.invoiceLetter = this.letter;
        } else {
          this.selectedTaxCategory = {
            value: parseInt(this.tax),
            name: this.tax + '%',
            invoiceLetter: this.letter
          }
        }
        await this.updateTaxCategory(this.selectedTaxCategory._id, this.selectedTaxCategory);
        this.tax = '';
        this.letter = '';
        this.dialogNewTaxCategory = false;
      },
      open(isEdit) {
        if (isEdit && this.selectedTaxCategory) {
          this.tax = this.selectedTaxCategory.value.toString()
          this.letter = this.selectedTaxCategory.invoiceLetter;
        } else {
          this.tax = '';
          this.letter = '';
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
