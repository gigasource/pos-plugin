<script>
import { genScopeId, internalValueFactory } from '../utils';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

export default {
  props: {
    modelValue: String
  },
  emits: ['login', 'clear', 'append', 'delete', 'update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    //todo: translate: 'clear'
    const numpad = computed(() => ([
      { content: ['7'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key7; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['8'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key8; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['9'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key9; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['4'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key4; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['5'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key5; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['6'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key6; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['1'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key1; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['2'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key2; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['3'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key3; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['0'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onAppend, style: 'grid-area: key0; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: ['Clear'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: onClear, style: 'grid-area: keyClear; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: [''], icon: 'mdi-backspace', classes: 'key-number bg-white ba-blue-9 ba-thin', action: onDelete, style: 'grid-area: keyBack; width: 100%; height: 100%; border: 1px solid #979797;' },
      { content: [t('login.key')], classes: 'key-login key-number ba-blue-9 ba-thin', action: onLogin, style: 'grid-area: keyLogin; background-color: #2979FF; color: #ffffff; border: none; font-size: 16px;text-transform: capitalize; text-align: center' },
    ]))

    const template = 'grid-template: "key7 key8 key9 keyLogin" "key4 key5 key6 keyLogin" "key1 key2 key3 keyLogin" "keyClear key0 keyBack keyLogin"/ 1fr 1fr 1fr 1fr'
    const internalValue = internalValueFactory(props, { emit })

    function onLogin() {
      if (!props.modelValue) return '';
      emit('login', internalValue.value);
      return internalValue.value
    }

    function onClear() {
      emit('clear');
      return ''
    }

    function onAppend(value, append) {
      emit('append');
      return value + append
    }

    function onDelete(value) {
      emit('delete');
      return value.substring(0, value.length - 1)
    }

    return genScopeId(() => <g-keyboard items={numpad.value} template={template} v-model={internalValue.value}/>)
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
      background-color: rgba(132, 255, 255, 0.21);
    }
  }
}
</style>
