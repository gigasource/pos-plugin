<template>
  <div class="picker-wrapper">
    <template v-for="item in values">
      <slot name="item" :item="item" :select="pickValue" :isSelected="isValueSelected">
        <g-btn-bs  @click.stop="pickValue(item)"
                   :class="['mb-1',isValueSelected(item) ? 'selected' : null]"
                   border-color="#C4C4C4" text-color="black" width="40" height="30">
          {{item}}
        </g-btn-bs>
      </slot>
    </template>
    <g-text-field-bs ref="input" v-if="allowCustom" :placeholder="$t('onlineOrder.customTime')" :value="inputValue" @input="pickCustomValue">
      <template v-slot:append-inner>
        <g-icon style="cursor: pointer" @click="dialog = true">icon-keyboard</g-icon>
      </template>
    </g-text-field-bs>
    <dialog-number-filter v-model="dialog" label="Custom time" @submit="changeValue"/>
  </div>
</template>

<script>
  export default {
    name: 'ValuePicker',
    props: {
      values: Array,
      allowCustom: Boolean,
      value: null,
      defaultValue: null
    },
    data() {
      return {
        inputValue: (!this.values.includes(this.value) && this.value) || '',
        dialog: false
      }
    },
    methods: {
      pickValue(val) {
        if (this.allowCustom) {
          this.inputValue = null
        }
        this.$emit('input', val)
      },
      pickCustomValue(val) {
        this.$emit('input', +val)
      },
      isValueSelected(val) {
        return this.value === val
      },
      changeValue(val) {
        this.inputValue = +val
        this.pickCustomValue(val)
      }
    },
    mounted() {
      this.$nextTick(() => {
        if (!this.value && this.defaultValue) this.$emit('input', this.defaultValue)
      })
    }
  }
</script>

<style scoped lang="scss">
  .picker-wrapper {
    .selected {
      background: #E3F2FD !important;
      border: 1px solid #90CAF9 !important;
    }

    .bs-tf-wrapper {
      margin: 0 8px;
      width: calc(100% - 16px);

      ::v-deep .bs-tf-input {
        width: 100%;
        font-size: 14px;

        &::placeholder {
          font-size: 14px;
        }
      }
    }
  }
</style>
