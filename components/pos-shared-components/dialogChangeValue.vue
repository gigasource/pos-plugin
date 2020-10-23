<template>
  <g-dialog v-model="dialog" overlay-color="#6b6f82" overlay-opacity="0.95" fullscreen>
    <div class="dialog-change w-100" :style="[{background: 'white'}]">
      <g-icon class="dialog-change--close" @click="dialog = false">close</g-icon>
      <discount-input :type="changeType" :value="change" @submit="submit" @remove-discount="removeDiscount"/>
    </div>
  </g-dialog>
</template>

<script>
  import ChangeValue from './ChangeValue';
  import DiscountInput from "./DiscountInput";
  export default {
    name: 'dialogChangeValue',
    components: {DiscountInput, ChangeValue },
    props: {
      value: Boolean,
      newValueEditable: false,
    },
    data() {
      return {
        changeType: null,
        showDialog: false,
        originalValue: 0,
        change: 0
      }
    },
    computed: {
      dialog: {
        get() {
          return this.showDialog;
        },
        set(value) {
          this.showDialog = value
          this.$emit('input', value);
        }
      },

    },
    watch: {
      value: val => {
        this.showDialog = val
      },
    },
    methods: {
      open(originalValue, discount) {
        this.originalValue = +originalValue
        this.changeType = discount ? discount.type : 'percentage'
        this.change = discount ? discount.change : 0
        this.dialog = true
      },
      submit(update) {
        if (this.originalValue) {
          this.changeType = update.type
          this.change = +update.value
          let difference
          if(update.type === 'percentage') {
            difference = this.originalValue * this.change / 100
          } else {
            difference = this.change
          }
          const change = {
            type: this.changeType,
            value: this.originalValue - this.change,
            difference,
            change: this.change
          }
          this.$emit('submit', change);
        }
        this.dialog = false;
      },
      removeDiscount() {
        this.$getService('OrderStore:resetOrderDiscount')()
        this.dialog = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog-change {
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    position: relative;

    &--close {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 2;
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
