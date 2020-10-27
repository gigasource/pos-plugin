<template>
  <g-keyboard :items="numpad" :template="template" v-model="internalValue"/>
</template>

<script>
  export default {
    name: 'PosLoginKeyboard',
    props: {
      value: String
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        }
      }
    },
    data: function () {
      return {
        numpad: [
          { content: ['7'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key7; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['8'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key8; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['9'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key9; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['4'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key4; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['5'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key5; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['6'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key6; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['1'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key1; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['2'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key2; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['3'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key3; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['0'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.append, style: 'grid-area: key0; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['Clear'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.clear, style: 'grid-area: keyClear; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: [''], icon: 'mdi-backspace', classes: 'key-number bg-white ba-blue-9 ba-thin', action: this.delete, style: 'grid-area: keyBack; width: 100%; height: 100%; border: 1px solid #979797;' },
          { content: ['LOGIN'], classes: 'key-login key-number ba-blue-9 ba-thin', action: this.keyboardLogin, style: 'grid-area: keyLogin; background-color: #2979FF; color: #ffffff; border: none; font-size: 16px;' },
        ],
        template: 'grid-template: "key7 key8 key9 keyLogin" "key4 key5 key6 keyLogin" "key1 key2 key3 keyLogin" "keyClear key0 keyBack keyLogin"/ 1fr 1fr 1fr 1fr',
      };
    },
    methods: {
      keyboardLogin() {
        if (!this.value) return '';
        this.$emit('login', this.internalValue);
        return this.internalValue
      },
      clear() {
        this.$emit('clear');
        return ''
      },
      append(value, append) {
        this.$emit('append');
        return value + append
      },
      delete(value) {
        this.$emit('delete');
        return value.substring(0, value.length - 1)
      }
    }
  }
</script>

<style lang="scss" scoped>
    .keyboard__template {
      ::v-deep .key-number {
        font-size: 20px;
        line-height: 25px;

        .waves-ripple {
          background-color: rgba(255, 190, 92, 1)
        }

        &.key-login .waves-ripple {
          background-color: rgba(132, 255, 255, 0.21)
        }
      }
    }
</style>
