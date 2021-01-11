<template>
  <div class="picker-wrapper">
    <template v-for="item in values">
      <slot name="item" :item="item" :select="pickValue" :isSelected="isValueSelected">
        <g-btn-bs  @click.stop="pickValue(item)"
                   :class="['mb-1', isValueSelected(item) && 'selected']"
                   border-color="#C4C4C4" text-color="black" width="40" height="30">
          {{item}}
        </g-btn-bs>
      </slot>
    </template>
    <g-text-field-bs ref="input" v-if="allowCustom" :placeholder="$t('onlineOrder.customTime')" :model-value="inputValue" @update:modelValue="pickCustomValue">
      <template v-slot:append-inner>
        <g-icon style="cursor: pointer" @click="dialog = true">icon-keyboard</g-icon>
      </template>
    </g-text-field-bs>
    <dialog-number-filter v-model="dialog" label="Custom time" @submit="changeValue"/>
  </div>
</template>

<script>
  import { nextTick } from 'vue';

  export default {
    name: 'ValuePicker',
    props: {
      values: Array,
      allowCustom: Boolean,
      modelValue: null,
      defaultValue: null
    },
    data() {
      return {
        inputValue: (!this.values.includes(this.modelValue) && this.modelValue) || '',
        dialog: false
      }
    },
    methods: {
      pickValue(val) {
        if (this.allowCustom) {
          this.inputValue = null
        }
        this.$emit('update:modelValue', val)
      },
      pickCustomValue(val) {
        this.$emit('update:modelValue', +val)
      },
      isValueSelected(val) {
        return this.modelValue === val
      },
      changeValue(val) {
        this.inputValue = +val
        this.pickCustomValue(val)
      }
    },
    mounted() {
      nextTick(() => {
        if (!this.modelValue && this.defaultValue) this.$emit('update:modelValue', this.defaultValue)
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
