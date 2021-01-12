<template>
  <g-dialog v-model="internalValue">
    <g-card>
      <g-card-title class="justify-center"><span>Connect to Server</span></g-card-title>
      <g-card-text>
        <g-radio-group name="custom-url" v-model="radioValue">
          <g-radio color="#536DFE" label="Use config" value=""/>
          <g-radio color="#536DFE" label="https://pos.gigasource.io" value="https://pos.gigasource.io"/>
          <g-radio color="#536DFE" label="https://online-order.gigasource.io" value="https://online-order.gigasource.io"/>
          <g-radio color="#536DFE" label="Custom" value="custom"/>
          <g-text-field-bs :disabled="radioValue !== 'custom'" v-model="customUrl"/>
        </g-radio-group>
      </g-card-text>
      <div class="pa-3 bg-grey">
        <pos-keyboard-full/>
      </div>
      <g-card-actions>
        <g-spacer/>
        <g-btn-bs height="36" width="120" @click.stop="cancel">Cancel</g-btn-bs>
        <g-btn-bs height="36" width="120" background-color="#2979FF" @click.stop="confirm">Confirm</g-btn-bs>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';
  
  export default {
    name: 'dialogCustomUrl',
    components: {PosKeyboardFull},
    props: {
      modelValue: Boolean
    },
    data() {
      return {
        radioValue: '',
        customUrl: '',
        values: ['https://pos.gigasource.io', 'https://online-order.gigasource.io', '']
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      url() {
        return this.radioValue === 'custom' ? this.customUrl : this.radioValue
      },
      allowConfirm() {
        if (this.radioValue === 'custom' && this.customUrl) return true
        return true
      }
    },
    methods: {
      cancel() {
        this.internalValue = false
      },
      confirm() {
        this.$emit('confirm', this.url)
        this.internalValue = false
      }
    },
    watch: {
      value: {
        handler(val) {
          if (!val) return

          this.$emit('getServerUrl', url => {
            if (!url) {
              this.radioValue = ''
              return
            }
            if (this.values.includes(url)) {
              this.radioValue = url
            } else {
              this.radioValue = 'custom'
              this.customUrl = url
            }
          })
        },
        immediate: true
      }
    }
  }
</script>

<style scoped>

</style>
