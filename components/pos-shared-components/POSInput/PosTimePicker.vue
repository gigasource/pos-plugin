<template>
  <div class="pos-time-picker">
    <g-time-picker-input append-inner-icon="access_time" use24-hours :label="label"
                         v-model="internalValue"
    ></g-time-picker-input>
  </div>
</template>

<script>
  export default {
    name: 'PosTimePicker',
    props: {
      label: String,
      modelValue: String,
    },
    data() {
      return {
        lazyValue: ''
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.lazyValue
        },
        set(value) {
          this.lazyValue = value
          this.$emit('update:modelValue', value)
        }
      }
    },
    emits: ['update:modelValue'],
    watch: {
      modelValue: {
        handler(val) {
          if (val) this.lazyValue = val
        },
        immediate: true
      }
    }
  }
</script>

<style lang="scss" scoped>
  .pos-time-picker {
    width: 100%;
    margin-top: 23px;

    ::v-deep .g-tf-wrapper {
      cursor: text;
      width: calc(100% - 10px);
      margin: 0;
      background-color: #F0F0F0;
      padding-left: 6px;
      padding-right: 6px;
      border: 1px solid #ced4da !important;
      flex-basis: 100%;
      align-items: center;
      transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

      &.g-tf::before, &.g-tf::after {
        display: none;
      }

      .g-tf-label {
        color: #1d1d1d;
        display: inline-block;
        margin-bottom: 8px;
        font-size: 13px;
        line-height: 16px;
        font-weight: 400;
        top: -23px;
        left: -1px;
      }

      .g-tf-label__active {
        transform: none;
      }

      .g-tf-input-text {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        font-size: 14px;
        line-height: 18px;
        font-weight: 400;
        color: #9E9E9E;
        background-color: #FFFFFF;
        white-space: nowrap;
        text-align: center;
        border: 1px solid #ced4da;
        width: 100%;
      }

      .g-tf-input {
        display: block;
        width: 100%;
        padding: 6px 8px;
        line-height: 24px;
        font-size: 14px;
        background-clip: padding-box;
        color: #000000;
        transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }
    }
  }
</style>
