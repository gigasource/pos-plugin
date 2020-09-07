<template>
  <div class="row-flex justify-center">
    <g-keyboard-auto :items="keyboard" :template="template" @submit="enterPressed"
                     :style="[{ width: '80%' },
                      computedType === 'numeric' && { width: '50%' },
                      computedType === 'alphanumeric' && { width: '100%' }
                      ]"/>
  </div>
</template>

<script>
  const keys = Object.freeze({
    baseEN: {
      keyQ: { content: ['q', 'Q'], img: '', style: 'grid-area: q' },
      keyW: { content: ['w', 'W'], img: '', style: 'grid-area: w' },
      keyE: { content: ['e', 'E'], img: '', style: 'grid-area: e' },
      keyR: { content: ['r', 'R'], img: '', style: 'grid-area: r' },
      keyT: { content: ['t', 'T'], img: '', style: 'grid-area: t' },
      keyY: { content: ['y', 'Y'], img: '', style: 'grid-area: y' },
      keyU: { content: ['u', 'U'], img: '', style: 'grid-area: u' },
      keyI: { content: ['i', 'I'], img: '', style: 'grid-area: i' },
      keyO: { content: ['o', 'O'], img: '', style: 'grid-area: o' },
      keyP: { content: ['p', 'P'], img: '', style: 'grid-area: p' },
      keyA: { content: ['a', 'A'], img: '', style: 'grid-area: a' },
      keyS: { content: ['s', 'S'], img: '', style: 'grid-area: s' },
      keyD: { content: ['d', 'D'], img: '', style: 'grid-area: d' },
      keyF: { content: ['f', 'F'], img: '', style: 'grid-area: f' },
      keyG: { content: ['g', 'G'], img: '', style: 'grid-area: g' },
      keyH: { content: ['h', 'H'], img: '', style: 'grid-area: h' },
      keyJ: { content: ['j', 'J'], img: '', style: 'grid-area: j' },
      keyK: { content: ['k', 'K'], img: '', style: 'grid-area: k' },
      keyL: { content: ['l', 'L'], img: '', style: 'grid-area: l' },
      keyZ: { content: ['z', 'Z'], img: '', style: 'grid-area: z' },
      keyX: { content: ['x', 'X'], img: '', style: 'grid-area: x' },
      keyC: { content: ['c', 'C'], img: '', style: 'grid-area: c' },
      keyV: { content: ['v', 'V'], img: '', style: 'grid-area: v' },
      keyB: { content: ['b', 'B'], img: '', style: 'grid-area: b' },
      keyN: { content: ['n', 'N'], img: '', style: 'grid-area: n' },
      keyM: { content: ['m', 'M'], img: '', style: 'grid-area: m' },
      keySpace: { style: 'grid-area: space', action: caret => caret.insert(' ') },
      keyComma: { content: [','], img: '', style: 'grid-area: comma' },
      keyDot: { content: ['.'], img: '', style: 'grid-area: dot' },
      keyDel: {
        content: [''],
        img: 'delivery/key_delete',
        style: 'grid-area: del; background-color: #e0e0e0',
        action: 'delete'
      },
    },
    mods: {
      keyEnter: { content: ['Save'], style: 'grid-area: enter; background: #2979FF; color: #fff; font-size: 20px', type: 'enter', action: 'enter' },
      keyShift: { content: [], img: 'delivery/key_shift', style: 'grid-area: shift1; background-color: #e0e0e0', type: 'shift', action: 'shift' },
      keySym: { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => null },
      keyLang: { content: ['EN'], img: '', style: 'grid-area: lang; background-color: #e0e0e0; font-size: 14px', action: () => null },
    },
    baseDE: {
      keyUe: { content: ['ü', 'Ü'], img: '', style: 'grid-area: ue' },
      keySs: { content: ['ß'], img: '', style: 'grid-area: ss' },
      keyOe: { content: ['ö', 'Ö'], img: '', style: 'grid-area: oe' },
      keyAe: { content: ['ä', 'Ä'], img: '', style: 'grid-area: ae' },
    },
    numpad: {
      key7: { content: ['7'], style: 'grid-area: key7' },
      key8: { content: ['8'], style: 'grid-area: key8' },
      key9: { content: ['9'], style: 'grid-area: key9' },
      key4: { content: ['4'], style: 'grid-area: key4' },
      key5: { content: ['5'], style: 'grid-area: key5' },
      key6: { content: ['6'], style: 'grid-area: key6' },
      key1: { content: ['1'], style: 'grid-area: key1' },
      key2: { content: ['2'], style: 'grid-area: key2' },
      key3: { content: ['3'], style: 'grid-area: key3' },
      key0: { content: ['0'], style: 'grid-area: key0' },
      keyDot: { content: ['.'], style: 'grid-area: keyDot' },
    },
    symbols: {
      key1: { content: ['1'], style: 'grid-area: key1' },
      key2: { content: ['2'], style: 'grid-area: key2' },
      key3: { content: ['3'], style: 'grid-area: key3' },
      key4: { content: ['4'], style: 'grid-area: key4' },
      key5: { content: ['5'], style: 'grid-area: key5' },
      key6: { content: ['6'], style: 'grid-area: key6' },
      key7: { content: ['7'], style: 'grid-area: key7' },
      key8: { content: ['8'], style: 'grid-area: key8' },
      key9: { content: ['9'], style: 'grid-area: key9' },
      key0: { content: ['0'], style: 'grid-area: key0' },
      keyAt: { content: ['@'], img: '', style: 'grid-area: at' },
      keyHash: { content: ['#'], img: '', style: 'grid-area: hash' },
      keyDot: { content: ['.'], style: 'grid-area: dot' },
      keyDollar: { content: ['$'], img: '', style: 'grid-area: dollar' },
      keyEur: { content: ['€'], img: '', style: 'grid-area: eur' },
      keyAmp: { content: ['&'], img: '', style: 'grid-area: amp' },
      keyHyphen: { content: ['-'], img: '', style: 'grid-area: hyphen' },
      keyUnderscore: { content: ['_'], img: '', style: 'grid-area: underscore' },
      keyOpenBr: { content: ['('], img: '', style: 'grid-area: leftpar' },
      keyCloseBr: { content: [')'], img: '', style: 'grid-area: rightpar' },
      keySlash: { content: ['/'], img: '', style: 'grid-area: slash' },
      keyShift: { content: [], img: 'delivery/key_shift', style: 'grid-area: shift1; background-color: #e0e0e0', type: 'shift', action: 'shift' },
      keyAst: { content: ['*'], img: '', style: 'grid-area: ast' },
      keyQuot: { content: ['"'], img: '', style: 'grid-area: quot' },
      keyApos: { content: ['\''], img: '', style: 'grid-area: apos' },
      keyColon: { content: [':'], img: '', style: 'grid-area: colon' },
      keySemiColon: { content: [';'], img: '', style: 'grid-area: semicolon' },
      keyQuotMark: { content: ['!'], img: '', style: 'grid-area: quotmk' },
      keyQnMark: { content: ['?'], img: '', style: 'grid-area: qnmk' },
      keyComma: { content: [','], img: '', style: 'grid-area: comma' },
      keyPercent: { content: ['%'], img: '', style: 'grid-area: percent' },
      keySym: { content: ['ABC'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => null },
      keyEnter: { content: ['Save'], style: 'grid-area: enter; background: #2979FF; color: #fff; font-size: 20px', type: 'enter', action: 'enter' },
      keySpace: { style: 'grid-area: space', action: caret => caret.insert(' ') },
      keyDel: {
        content: [''],
        img: 'delivery/key_delete',
        style: 'grid-area: del; background-color: #e0e0e0',
        action: 'delete'
      },
    }
  })

  export default {
    name: 'PosKeyboardFull',
    injectService: ['PosStore:locale'],
    data() {
      return {
        keyboardEnglish: [
          ...Object.values(keys.baseEN),
          ...Object.values(keys.numpad),
          ...Object.values(keys.mods),
          { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => this.computedType = 'symbol-numeric' },
        ],
        templateEnglish: 'grid-template-areas: " q q w w e e r r t t y y u u i i o o p p key7 key7 key8 key8 key9 key9" ' +
          '". a a s s d d f f g g h h j j k k l l . key4 key4 key5 key5 key6 key6" ' +
          '"shift1 shift1 shift1 z z x x c c v v b b n n m m del del del key1 key1 key2 key2 key3 key3" ' +
          '"sym sym sym comma comma lang lang space space space space space space space space dot dot enter enter enter key0 key0 key0 key0 keyDot keyDot";' +
          'grid-auto-columns: 1fr; grid-gap: 8px',
        keyboardGerman: [
          ...Object.values(keys.baseEN),
          ...Object.values(keys.baseDE),
          ...Object.values(keys.mods),
          ...Object.values(keys.numpad),
          { content: ['DE'], img: '', style: 'grid-area: lang; background-color: #e0e0e0; font-size: 14px', action: () => null },
          { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => this.computedType = 'symbol-numeric' },
          { content: ['Speichern'], style: 'grid-area: enter; background: #2979FF; color: #fff; font-size: 20px', type: 'enter', action: 'enter' },
    ],
        templateGerman: 'grid-template-areas: "q q w w e e r r t t z z u u i i o o p p ue ue ss ss key7 key7 key8 key8 key9 key9 " ' +
          '". a a s s d d f f g g h h j j k k l l oe oe ae ae . key4 key4 key5 key5 key6 key6" ' +
          '"shift1 shift1 shift1 shift1 shift1 y y x x c c v v b b n n m m del del del del del key1 key1 key2 key2 key3 key3" ' +
          '"sym sym sym comma comma lang lang space space space space space space space space space space dot dot enter enter enter enter enter key0 key0 key0 key0 keyDot keyDot";' +
          'grid-auto-columns: 1fr; grid-gap: 5px',
        keyboardNumeric: [
          ...Object.values(keys.numpad),
          keys.mods.keyEnter,
          keys.baseEN.keyDel,
        ],
        templateNumeric: 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
          '"key4 key4 key5 key5 key6 key6" ' +
          '"key1 key1 key2 key2 key3 key3" ' +
          '"keyDot keyDot key0 key0 del enter";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardAlphaEN: [
          ...Object.values(keys.baseEN),
          ...Object.values(keys.mods),
          { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => this.computedType = 'symbol' },
        ],
        templateAlphaEN: 'grid-template-areas: " q q w w e e r r t t y y u u i i o o p p " ' +
          '". a a s s d d f f g g h h j j k k l l . " ' +
          '"shift1 shift1 shift1 z z x x c c v v b b n n m m del del del " ' +
          '"sym sym sym comma comma lang lang space space space space space space space space dot dot enter enter enter ";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardAlphaDE: [
          ...Object.values(keys.baseEN),
          ...Object.values(keys.baseDE),
          ...Object.values(keys.mods),
          { content: ['DE'], img: '', style: 'grid-area: lang; background-color: #e0e0e0; font-size: 14px', action: () => null },
          { content: ['*#$'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => this.computedType = 'symbol' },
          { content: ['Speichern'], style: 'grid-area: enter; background: #2979FF; color: #fff; font-size: 20px', type: 'enter', action: 'enter' },
        ],
        templateAlphaDE: 'grid-template-areas: "q q w w e e r r t t z z u u i i o o p p ue ue ss ss key7 key7 key8 key8 key9 key9 " ' +
          '". a a s s d d f f g g h h j j k k l l oe oe ae ae . key4 key4 key5 key5 key6 key6" ' +
          '"shift1 shift1 shift1 shift1 shift1 y y x x c c v v b b n n m m del del del del del key1 key1 key2 key2 key3 key3" ' +
          '"sym sym sym comma comma lang lang space space space space space space space space space space dot dot enter enter enter enter enter key0 key0 key0 key0 keyDot keyDot";' +
          'grid-auto-columns: 1fr; grid-gap: 5px',
        keyboardSymbol: [
          ...Object.values(keys.symbols),
          { content: ['ABC'], img: '', style: 'grid-area: sym; background-color: #e0e0e0; font-size: 14px', action: () => this.computedType = this.computedType === 'symbol' ? 'alpha' : 'alphanumeric' },
        ],
        templateSymbol: 'grid-template-areas: " key1 key1 key2 key2 key3 key3 key4 key4 key5 key5 key6 key6 key7 key7 key8 key8 key9 key9 key0 key0 " ' +
          '"at at hash hash dollar dollar eur eur amp amp hyphen hyphen underscore underscore leftpar leftpar rightpar rightpar slash slash" ' +
          '"shift1 shift1 shift1 ast ast quot quot apos apos colon colon semicolon semicolon quotmk quotmk qnmk qnmk del del del " ' +
          '"sym sym sym comma comma percent percent space space space space space space space space dot dot enter enter enter ";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        internalType: 'alphanumeric'
      }
    },
    props: {
      value: null,
      type: {
        type: String,
        default: 'alphanumeric' //numeric, alpha, alphanumeric, symbol
      },
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
      computedType: {
        get() {
          return this.internalType
        },
        set(val) {
          this.internalType = val
          this.$emit('change-type', val)
        }
      },
      keyboard() {
        switch (this.computedType) {
          case 'alpha':
            return this.locale === 'de' ? this.keyboardAlphaDE : this.keyboardAlphaEN
          case 'numeric':
            return this.keyboardNumeric
          case 'symbol':
            return this.keyboardSymbol
          case 'symbol-numeric':
            return this.keyboardSymbol
          default:
            return this.locale === 'de' ? this.keyboardGerman :this.keyboardEnglish
        }
      },
      template() {
        switch (this.computedType) {
          case 'alpha':
            return this.locale === 'de' ? this.templateAlphaDE : this.templateAlphaEN
          case 'numeric':
            return this.templateNumeric
          case 'symbol':
            return this.templateSymbol
          case 'symbol-numeric':
            return this.templateSymbol
          default:
            return this.locale === 'de' ? this.templateGerman : this.templateEnglish
        }
      }
    },
    methods: {
      enterPressed(val) {
        this.$emit('enter-pressed', val)
      }
    },
    watch: {
      type: {
        handler(val) {
          if (val) this.internalType = val
        },
        immediate: true
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
