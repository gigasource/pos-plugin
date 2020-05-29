<template>
  <g-keyboard-auto :items="keyboardFull" :template="templateFull" @submit="enterPressed"></g-keyboard-auto>
</template>

<script>
  export default {
    name: 'PosKeyboardFull',
    injectService: ['PosStore:locale'],
    data() {
      return {
        keyboardEnglish: [
          { content: ['Tab'], img: '', style: 'grid-area: tab; background-color: #e0e0e0; font-size: 14px', action: caret => caret.insert('    ') },
          { content: ['q', 'Q'], img: '', style: 'grid-area: q' },
          { content: ['w', 'W'], img: '', style: 'grid-area: w' },
          { content: ['e', 'E'], img: '', style: 'grid-area: e' },
          { content: ['r', 'R'], img: '', style: 'grid-area: r' },
          { content: ['t', 'T'], img: '', style: 'grid-area: t' },
          { content: ['y', 'Y'], img: '', style: 'grid-area: y' },
          { content: ['u', 'U'], img: '', style: 'grid-area: u' },
          { content: ['i', 'I'], img: '', style: 'grid-area: i' },
          { content: ['o', 'O'], img: '', style: 'grid-area: o' },
          { content: ['p', 'P'], img: '', style: 'grid-area: p' },
          {
            content: [''],
            img: 'delivery/key_delete',
            style: 'grid-area: del; background-color: #e0e0e0',
            action: 'delete'
          },
          { content: ['Caps lock'], img: '', style: 'grid-area: caps; background-color: #e0e0e0; font-size: 14px', action: 'shift' },
          { content: ['a', 'A'], img: '', style: 'grid-area: a' },
          { content: ['s', 'S'], img: '', style: 'grid-area: s' },
          { content: ['d', 'D'], img: '', style: 'grid-area: d' },
          { content: ['f', 'F'], img: '', style: 'grid-area: f' },
          { content: ['g', 'G'], img: '', style: 'grid-area: g' },
          { content: ['h', 'H'], img: '', style: 'grid-area: h' },
          { content: ['j', 'J'], img: '', style: 'grid-area: j' },
          { content: ['k', 'K'], img: '', style: 'grid-area: k' },
          { content: ['l', 'L'], img: '', style: 'grid-area: l' },
          { content: [], img: 'delivery/key_enter', style: 'grid-area: enter; background-color: #e0e0e0', type: 'enter', action: 'enter' },
          { content: [], img: 'delivery/key_shift', style: 'grid-area: shift1; background-color: #e0e0e0', type: 'shift', action: 'shift' },
          { content: ['z', 'Z'], img: '', style: 'grid-area: z' },
          { content: ['x', 'X'], img: '', style: 'grid-area: x' },
          { content: ['c', 'C'], img: '', style: 'grid-area: c' },
          { content: ['v', 'V'], img: '', style: 'grid-area: v' },
          { content: ['b', 'B'], img: '', style: 'grid-area: b' },
          { content: ['n', 'N'], img: '', style: 'grid-area: n' },
          { content: ['m', 'M'], img: '', style: 'grid-area: m' },
          { content: [','], img: '', style: 'grid-area: comma' },
          { content: ['.'], img: '', style: 'grid-area: dot' },
          { content: ['/'], img: '', style: 'grid-area: splash' },
          { content: [], img: 'delivery/key_shift', style: 'grid-area: shift2; background-color: #e0e0e0', type: 'shift', action: 'shift' },
          { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => null },
          { content: ['&'], img: '', style: 'grid-area: amp' },
          { content: ['%'], img: '', style: 'grid-area: pct' },
          { content: ['€'], img: '', style: 'grid-area: pnd' },
          { style: 'grid-area: space', action: caret => caret.insert(' ') },
          { content: ['@'], img: '', style: 'grid-area: at' },
          { content: ['EN'], img: '', style: 'grid-area: lang; background-color: #e0e0e0; font-size: 14px', action: () => null },
          { content: ['&rarr;'], img: '', style: 'grid-area: rarr; background-color: #e0e0e0', action: () => null },
          { content: ['&larr;'], img: '', style: 'grid-area: larr; background-color: #e0e0e0', action: () => null },
          { content: ['7'], style: 'grid-area: key7' },
          { content: ['8'], style: 'grid-area: key8' },
          { content: ['9'], style: 'grid-area: key9' },
          { content: ['4'], style: 'grid-area: key4' },
          { content: ['5'], style: 'grid-area: key5' },
          { content: ['6'], style: 'grid-area: key6' },
          { content: ['1'], style: 'grid-area: key1' },
          { content: ['2'], style: 'grid-area: key2' },
          { content: ['3'], style: 'grid-area: key3' },
          { content: ['0'], style: 'grid-area: key0' },
          { content: ['.'], style: 'grid-area: keyDot' },
        ],
        templateEnglish: 'grid-template-areas: "tab tab q q w w e e r r t t y y u u i i o o p p del del del del key7 key7 key8 key8 key9 key9" ' +
          '"caps caps caps a a s s d d f f g g h h j j k k l l enter enter enter enter enter key4 key4 key5 key5 key6 key6" ' +
          '"shift1 shift1 shift1 shift1 z z x x c c v v b b n n m m comma comma dot dot splash splash shift2 shift2 key1 key1 key2 key2 key3 key3" ' +
          '"sym sym amp amp pct pct pnd pnd space space space space space space space space space space at at lang lang larr larr rarr rarr key0 key0 key0 key0 keyDot keyDot";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardGerman: [
          { content: ['Tab'], img: '', style: 'grid-area: tab; background-color: #e0e0e0; font-size: 14px', action: caret => caret.insert('    ') },
          { content: ['q', 'Q'], img: '', style: 'grid-area: q' },
          { content: ['w', 'W'], img: '', style: 'grid-area: w' },
          { content: ['e', 'E'], img: '', style: 'grid-area: e' },
          { content: ['r', 'R'], img: '', style: 'grid-area: r' },
          { content: ['t', 'T'], img: '', style: 'grid-area: t' },
          { content: ['y', 'Y'], img: '', style: 'grid-area: y' },
          { content: ['u', 'U'], img: '', style: 'grid-area: u' },
          { content: ['i', 'I'], img: '', style: 'grid-area: i' },
          { content: ['o', 'O'], img: '', style: 'grid-area: o' },
          { content: ['p', 'P'], img: '', style: 'grid-area: p' },
          { content: ['ü', 'Ü'], img: '', style: 'grid-area: ue' },
          { content: ['ß'], img: '', style: 'grid-area: ss' },
          {
            content: [''],
            img: 'delivery/key_delete',
            style: 'grid-area: del; background-color: #e0e0e0',
            action: 'delete'
          },
          { content: ['Caps lock'], img: '', style: 'grid-area: caps; background-color: #e0e0e0; font-size: 14px', action: 'shift' },
          { content: ['a', 'A'], img: '', style: 'grid-area: a' },
          { content: ['s', 'S'], img: '', style: 'grid-area: s' },
          { content: ['d', 'D'], img: '', style: 'grid-area: d' },
          { content: ['f', 'F'], img: '', style: 'grid-area: f' },
          { content: ['g', 'G'], img: '', style: 'grid-area: g' },
          { content: ['h', 'H'], img: '', style: 'grid-area: h' },
          { content: ['j', 'J'], img: '', style: 'grid-area: j' },
          { content: ['k', 'K'], img: '', style: 'grid-area: k' },
          { content: ['l', 'L'], img: '', style: 'grid-area: l' },
          { content: ['ö', 'Ö'], img: '', style: 'grid-area: oe' },
          { content: ['ä', 'Ä'], img: '', style: 'grid-area: ae' },
          { content: [], img: 'delivery/key_enter', style: 'grid-area: enter; background-color: #e0e0e0', type: 'enter', action: 'enter' },
          { content: [], img: 'delivery/key_shift', style: 'grid-area: shift1; background-color: #e0e0e0', type: 'shift', action: 'shift' },
          { content: ['z', 'Z'], img: '', style: 'grid-area: z' },
          { content: ['x', 'X'], img: '', style: 'grid-area: x' },
          { content: ['c', 'C'], img: '', style: 'grid-area: c' },
          { content: ['v', 'V'], img: '', style: 'grid-area: v' },
          { content: ['b', 'B'], img: '', style: 'grid-area: b' },
          { content: ['n', 'N'], img: '', style: 'grid-area: n' },
          { content: ['m', 'M'], img: '', style: 'grid-area: m' },
          { content: [','], img: '', style: 'grid-area: comma' },
          { content: ['.'], img: '', style: 'grid-area: dot' },
          { content: ['/'], img: '', style: 'grid-area: splash' },
          { content: [], img: 'delivery/key_shift', style: 'grid-area: shift2; background-color: #e0e0e0', type: 'shift', action: 'shift' },
          { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => null },
          { content: ['&'], img: '', style: 'grid-area: amp' },
          { content: ['%'], img: '', style: 'grid-area: pct' },
          { content: ['€'], img: '', style: 'grid-area: pnd' },
          { style: 'grid-area: space', action: caret => caret.insert(' ') },
          { content: ['@'], img: '', style: 'grid-area: at' },
          { content: ['EN'], img: '', style: 'grid-area: lang; background-color: #e0e0e0; font-size: 14px', action: () => null },
          { content: ['&rarr;'], img: '', style: 'grid-area: rarr; background-color: #e0e0e0', action: () => null },
          { content: ['&larr;'], img: '', style: 'grid-area: larr; background-color: #e0e0e0', action: () => null },
          { content: ['7'], style: 'grid-area: key7' },
          { content: ['8'], style: 'grid-area: key8' },
          { content: ['9'], style: 'grid-area: key9' },
          { content: ['4'], style: 'grid-area: key4' },
          { content: ['5'], style: 'grid-area: key5' },
          { content: ['6'], style: 'grid-area: key6' },
          { content: ['1'], style: 'grid-area: key1' },
          { content: ['2'], style: 'grid-area: key2' },
          { content: ['3'], style: 'grid-area: key3' },
          { content: ['0'], style: 'grid-area: key0' },
          { content: ['.'], style: 'grid-area: keyDot' },
        ],
        templateGerman: 'grid-template-areas: "tab tab q q w w e e r r t t y y u u i i o o p p ue ue ss ss del del key7 key7 key8 key8 key9 key9" ' +
            '"caps caps caps a a s s d d f f g g h h j j k k l l oe oe ae ae enter enter enter key4 key4 key5 key5 key6 key6" ' +
            '"shift1 shift1 shift1 shift1 z z x x c c v v b b n n m m comma comma dot dot splash splash shift2 shift2 shift2 shift2 key1 key1 key2 key2 key3 key3" ' +
            '"sym sym amp amp pct pct pnd pnd space space space space space space space space space space space space at at lang lang larr larr rarr rarr key0 key0 key0 key0 keyDot keyDot";' +
            'grid-auto-columns: 1fr; grid-gap: 5px',
      }
    },
    props: {
      value: null,
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        }
      },
      keyboardFull() {
        if(this.locale === 'de')
          return this.keyboardGerman
        return this.keyboardEnglish
      },
      templateFull() {
        if(this.locale === 'de')
          return this.templateGerman
        return this.templateEnglish
      }
    },
    methods: {
      enterPressed(val) {
        this.$emit('enter-pressed', val)
      }
    }
  }
</script>

<style scoped>
  .keyboard__template {
    height: 100%;
  }

  ::v-deep .key {
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.216346);
    border-radius: 2px;
    font-size: 24px;
  }
</style>
