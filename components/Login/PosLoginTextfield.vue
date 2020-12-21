<template>
  <g-text-field error type="password" v-model="internalValue" :rules="rules" :key="key">
    <template v-if="showErrorMessage" v-slot:input-message>
      <div class="invalid-passcode-message">
        <g-icon color="red" size="16px" style="margin-right: 8px">mdi-close-circle</g-icon>
        <p style="color: #F44336;">{{ $t("login.errorPasscode") }}</p>
      </div>
    </template>
  </g-text-field>
</template>

<script>
  import { getInternalValue } from 'pos-vue-framework';

  export default {
    name: 'PosLoginTextfield',
    props: {
      modelValue: String,
      incorrectPasscode: Boolean
    },
    data() {
      return {
        showErrorMessage: false,
        rules: [],
        key: 0
      }
    },
    emits: ['update:modelValue'],
    mounted() {
      this.$watch('incorrectPasscode', function (val) {
        this.showErrorMessage = val
        if (val) {
          this.rules.splice(0, this.rules.length, () => 'incorrect');
        } else {
          this.rules.splice(0, this.rules.length);
        }
        this.key ++;
      });
    },
    setup() {
      const internalValue = getInternalValue(...arguments);
      return { internalValue }
    },
  }
</script>

<style lang="scss" scoped>
  ::v-deep .g-tf-input {
    text-align: center;
    font-size: 24px;
    letter-spacing: 12px;
    color: #2196F3;
  }

  ::v-deep .invalid-passcode-message {
    width: 100%;
    font-size: 16px;
    line-height: 20px;
    font-weight: 600;
    bottom: -32px;
    position: absolute;
    display: flex;
    justify-content: center;
  }

</style>
