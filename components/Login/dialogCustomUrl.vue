<template>
  <g-dialog width="40%" v-model="internalValue">
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
      <g-card-actions>
        <g-spacer/>
        <g-btn-bs height="36" width="120" @click.stop="cancel">Cancel</g-btn-bs>
        <g-btn-bs height="36" width="120" background-color="#2979FF" @click.stop="confirm">Confirm</g-btn-bs>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogCustomUrl',
    props: {
      value: Boolean
    },
    data() {
      return {
        radioValue: 'https://pos.gigasource.io',
        customUrl: '',
        values: ['https://pos.gigasource.io', 'https://online-order.gigasource.io', '']
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(value) {
          this.$emit('input', value)
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
      value(val) {
        if (!val) return

        this.$emit('getServerUrl', url => {
          debugger
          if (!url) {
            this.radioValue = ''
            return
          }
          if (!this.values.includes(url)) {
            this.radioValue = 'custom'
            this.customUrl = url
          }
        })
      }
    }
  }
</script>

<style scoped>

</style>