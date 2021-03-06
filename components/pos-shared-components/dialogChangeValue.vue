<template>
  <g-dialog v-model="dialog" overlay-color="#6b6f82" overlay-opacity="0.95" width="65%">
    <div class="dialog-change w-100" :style="[{background: showKeyboard ? 'white' : 'transparent'}]">
      <div class="dialog-change-content">
        <div class="header">
          <div class="header-side">
            <p style="padding-bottom: 9px">Original</p>
            <g-text-field read-only outlined :value="`€ ${originalValue}`"></g-text-field>
          </div>
          <div class="header-side">
            <p style="padding-bottom: 9px">Effective</p>
            <g-text-field read-only outlined class="tf__effective" :value="`€ ${computedValue}`"></g-text-field>
          </div>
        </div>
        <g-radio-group name="basic" v-model="changeType">
          <g-radio color="#1271ff" value="percentage" label="Discount by %"></g-radio>
          <div class="row-flex col-10 m-auto">
            <g-btn :uppercase="false" outlined :class="[disabledPercent && 'disabled']" :disabled="disabledPercent" @click="newPercent = '5'">- 5%</g-btn>
            <g-btn :uppercase="false" outlined :class="[disabledPercent && 'disabled']" :disabled="disabledPercent" @click="newPercent = '10'">- 10%</g-btn>
            <g-btn :uppercase="false" outlined :class="[disabledPercent && 'disabled']" :disabled="disabledPercent" @click="newPercent = '15'">- 15%</g-btn>
            <g-btn :uppercase="false" outlined :class="[disabledPercent && 'disabled']" :disabled="disabledPercent" @click="newPercent = '20'">- 20%</g-btn>
            <g-text-field dense outlined
                          :class="[disabledPercent && 'disabled']"
                          :disabled="disabledPercent"
                          v-model="newPercent"
                          style="flex-grow: 1"
                          placeholder="Other"
                          :prefix="newPercent ? '-' : ''"
                          :suffix="newPercent ? '%' : ''"
                          @click="showKeyboard = true"
                          :rules="[rules.percent]"></g-text-field>
          </div>
          <g-radio color="#1271ff" value="amount" label="Discount by €"></g-radio>
          <div class="row-flex col-10 m-auto">
            <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']"  :disabled="disabledAmount || originalValue - 5 < 0" @click="newAmount = '5'">- € 5</g-btn>
            <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']"  :disabled="disabledAmount || originalValue - 10 < 0" @click="newAmount = '10'">- € 10</g-btn>
            <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']"  :disabled="disabledAmount || originalValue - 15 < 0" @click="newAmount = '15'">- € 15</g-btn>
            <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']"  :disabled="disabledAmount || originalValue - 20 < 0" @click="newAmount = '20'">- € 20</g-btn>
            <g-text-field dense outlined
                          :class="[disabledAmount && 'disabled', 'tf-amount']"
                          :disabled="disabledAmount"
                          v-model="newAmount"
                          style="flex-grow: 1"
                          placeholder="Other"
                          :prefix="newAmount ? '- €' : ''"
                          :rules="[rulesAmount]"
                          @click="showKeyboard = true"></g-text-field>
          </div>
          <g-radio v-show="newValueEditable" color="#1271ff" value="new" label="New Price"></g-radio>
          <div v-show="newValueEditable" class="m-auto col-10">
            <g-text-field type="number" dense outlined placeholder="New Price" v-model="newValue" @click="showKeyboard = true" :class="[disabledNew && 'disabled']" :disabled="disabledNew"></g-text-field>
          </div>
        </g-radio-group>
        <div class="action">
          <g-btn :uppercase="false" flat outlined @click="dialog = false">Cancel</g-btn>
          <g-btn :uppercase="false" flat background-color="blue accent 3" text-color="white" @click="submit" :disabled="computedValue < 0">OK</g-btn>
        </div>
      </div>
      <div :style="[{visibility: showKeyboard ? 'visible' : 'hidden'}]" class="keyboard-wrapper">
        <pos-numpad v-model="keyboard"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogChangeValue',
    props: {
      value: Boolean,
      product: null,
      newValueEditable: false,
    },
    data() {
      return {
        changeType: null,
        showKeyboard: false,
        newValue: '',
        newPercent: '',
        newAmount: '',
        rules: {
          percent: value => (value <= 100 && value >= 0) || value === '' || 'Input: 0 - 100',
        },
        showDialog: false,
        originalValue: 0,
      }
    },
    computed: {
      computedValue() {
        if (this.originalValue) {
          if (this.changeType === 'percentage') {
            return (this.originalValue * (100 - parseFloat('0' + this.newPercent))) / 100
          }
          if (this.changeType === 'amount') return this.originalValue - parseFloat('0' + this.newAmount)
          if (this.changeType === 'new') return parseFloat('0' + this.newValue)
        }
        return 0
      },
      dialog: {
        get() {
          return this.showDialog;
        },
        set(value) {
          this.showDialog = value
          this.$emit('input', value);
        }
      },
      disabledPercent() {
        return this.changeType !== 'percentage'
      },
      disabledAmount() {
        return this.changeType !== 'amount'
      },
      disabledNew() {
        return this.changeType !== 'new'
      },
      keyboard: {
        get() {
          if(this.changeType === 'percentage')
            return this.newPercent;
          else if(this.changeType === 'amount')
            return this.newAmount;
          else if(this.changeType === 'new')
            return this.newValue;
        },
        set(val) {
          if(this.changeType === 'percentage')
            this.newPercent = val;
          else if(this.changeType === 'amount')
            this.newAmount = val;
          else if(this.changeType === 'new')
            this.newValue = val;
        }
      },
      rulesAmount() {
        const max = this.originalValue ? this.originalValue : 0;
        return (value) => (value < max) || 'Invalid Discount'
      }
    },
    watch: {
      value: val => {
        this.showDialog = val
      },
      dialog: function(val) {
        if(!val) {
          this.changeType = null;
          this.showKeyboard = false;
          this.newValue = '';
          this.newPercent = '';
          this.newAmount = '';
        }
      }
    },
    methods: {
      open(changeType, originalValue) {
        if (changeType && typeof changeType === 'string')
          this.changeType = changeType
        this.originalValue = originalValue
        this.dialog = true
      },
      submit() {
        if (this.originalValue) {
          const change = {
            type: this.changeType,
            value: this.computedValue,
            difference: (this.originalValue - this.computedValue)
          }
          this.$emit('submit', change);
        }
        this.dialog = false;
      },
    }
  }
</script>

<style lang="scss">
  .dialog-change {
    border-radius: 6px;
    display: flex;
    flex-direction: column;

    .dialog-change-content {
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: inherit;
      padding: 24px 48px;

      .header {
        display: flex;
        font-size: 13px;
        font-weight: 700;
        justify-content: center;

        .header-side {
          width: calc(41.6667% - 8px);
          margin: 0 8px;
        }

        .g-tf-wrapper {
          background-color: #F0F0F0;

          &.tf__effective input {
            color: #4CAF50;
            font-size: 24px;
          }

          input {
            font-size: 20px;
            line-height: 32px;
            font-weight: 700;
          }
        }
      }

      .g-tf-wrapper {
        margin: 0;

        fieldset {
          border-radius: 2px;
          border-color: #979797;
        }

        &.g-tf-wrapper__disabled fieldset {
          opacity: 0.42;
        }

        input::placeholder {
          text-align: center;
          font-size: 18px;
        }

        .g-tf-affix {
          white-space: nowrap;
        }

        input {
          text-align: center;
        }

        &.tf-amount .g-tf .g-tf-affix ~ .inputGroup .g-tf-input{
          padding-right: 45px;
        }
      }

      div:not(.action) .g-btn {
        height: 42px !important;
        border-color: #979797;
      }

      .g-btn:not(:last-child) {
        margin-right: 8px;
      }

      .g-radio-wrapper {
        line-height: 12px;
        margin: 16px 24px;

        .g-radio {
          display: inline-flex;
        }

        .g-radio-label {
          margin-left: 0;
          font-size: 13px;
          line-height: 16px;
        }
      }

      .action {
        display: flex;
        justify-content: flex-end;
        padding-top: 16px;

        .g-btn {
          min-width: 120px !important;

          &.g-btn__outlined {
            border: 1px solid #979797;
            color: #1d1d26;
          }
        }
      }

      .disabled {
        background-color: #f0f0f0;
        color: #c9c9c9;
        opacity: 1 !important;

        &.g-btn {
          border: 1px solid #c9c9c9 !important;
        }

        &.g-tf-wrapper {
          fieldset {
            border: 1px solid rgba(0, 0, 0, 0.4);
          }
        }
      }
    }

    .keyboard-wrapper {
      background-color: #bdbdbd;
      padding: 16px 180px;
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
      margin-top: -16px;

      .key-number {
        padding: 10px 8px;
        background: #FFFFFF;
        border: 1px solid #979797;
        box-sizing: border-box;
        border-radius: 4px;
        font-family: "Muli", sans-serif;
      }
    }
  }
</style>
