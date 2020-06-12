<template>
  <div class="dialog-change w-100" :style="[{background: 'white' }]">
    <div class="dialog-change-content">
      <div class="header">
        <div class="header-side">
          <p style="padding-bottom: 9px">{{$t('dialogs.original')}}</p>
          <g-text-field read-only outlined :value="`€ ${originalValue}`"></g-text-field>
        </div>
        <div class="header-side">
          <p style="padding-bottom: 9px">{{$t('dialogs.effective')}}</p>
          <g-text-field read-only outlined class="tf__effective" :value="`€ ${computedValue}`"></g-text-field>
        </div>
      </div>
      <g-radio-group name="basic" v-model="internalChangeType">
        <g-radio color="#1271ff" value="percentage" :label="`${$t('dialogs.effective')} %`"></g-radio>
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
                        :rules="[rules.percent]"></g-text-field>
        </div>
        <g-radio color="#1271ff" value="amount" :label="`${$t('dialogs.effective')} ${$t('common.currency', storeLocale)}`"></g-radio>
        <div class="row-flex col-10 m-auto">
          <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']" :disabled="disabledAmount || originalValue - 5 < 0" @click="newAmount = '5'">
            - {{$t('common.currency', storeLocale)}} 5
          </g-btn>
          <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']" :disabled="disabledAmount || originalValue - 10 < 0" @click="newAmount = '10'">
            - {{$t('common.currency', storeLocale)}} 10
          </g-btn>
          <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']" :disabled="disabledAmount || originalValue - 15 < 0" @click="newAmount = '15'">
            - {{$t('common.currency', storeLocale)}} 15
          </g-btn>
          <g-btn :uppercase="false" outlined :class="[disabledAmount && 'disabled']" :disabled="disabledAmount || originalValue - 20 < 0" @click="newAmount = '20'">
            - {{$t('common.currency', storeLocale)}} 20
          </g-btn>
          <g-text-field dense outlined
                        :class="[disabledAmount && 'disabled', 'tf-amount']"
                        :disabled="disabledAmount"
                        v-model="newAmount"
                        style="flex-grow: 1"
                        placeholder="Other"
                        :prefix="newAmount ? '- €' : ''"
                        :rules="[rulesAmount]"></g-text-field>
        </div>
        <g-radio v-show="newValueEditable" color="#1271ff" value="new" :label="$t('dialogs.newPrice')"></g-radio>
        <div v-show="newValueEditable" class="m-auto col-10">
          <g-text-field type="number" dense outlined :placeholder="$t('dialogs.newPrice')" v-model="newValue" :class="[disabledNew && 'disabled']" :disabled="disabledNew"></g-text-field>
        </div>
      </g-radio-group>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ChangeValue',
    injectService: ['PosStore:storeLocale'],
    props: {
      value: Boolean,
      newValueEditable: false,
      newValue: Number,
      changeType: String,
      originalValue: Number
    },
    data() {
      return {
        newPercent: '',
        newAmount: '',
        rules: {
          percent: value => (value <= 100 && value >= 0) || value === '' || 'Input: 0 - 100',
        },
      }
    },
    computed: {
      internalChangeType: {
        get() {
          return this.changeType
        },
        set(val) {
          this.$emit('update:changeType', val)
        }
      },
      computedValue() {
        if (this.originalValue) {
          if (this.internalChangeType === 'percentage') {
            return (this.originalValue * (100 - parseFloat('0' + this.newPercent))) / 100
          }
          if (this.internalChangeType === 'amount') return this.originalValue - parseFloat('0' + this.newAmount)
          if (this.internalChangeType === 'new') return parseFloat('0' + this.newValue)
          return this.originalValue
        }
        return 0
      },
      disabledPercent() {
        return this.internalChangeType !== 'percentage'
      },
      disabledAmount() {
        return this.internalChangeType !== 'amount'
      },
      disabledNew() {
        return this.internalChangeType !== 'new'
      },
      rulesAmount() {
        const max = this.originalValue ? this.originalValue : 0;
        return (value) => (value < max) || 'Invalid Discount'
      }
    },
    mounted() {
      this.newPercent = '';
      this.newAmount = '';
    },
    watch: {
      computedValue(val) {
        this.$emit('update:newValue', val)
      }
    }
  }
</script>

<style lang="scss">
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

      &.tf-amount .g-tf .g-tf-affix ~ .inputGroup .g-tf-input {
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
</style>
