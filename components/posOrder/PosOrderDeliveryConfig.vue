<template>
  <div class="delivery-config">
    <div class="delivery-config__title">
      Configuration
      <g-btn-bs class="elevation-2" icon="icon-back" @click="back">Back</g-btn-bs>
    </div>
    <div class="row-flex flex-grow-1">
      <div class="col-6">
        <div class="row-flex align-items-center mb-2">
          <p class="fw-600">Delivery Menu</p>
          <g-btn-bs background-color="#1271FF" @click="fetchMenu">Fetch</g-btn-bs>
        </div>
        <div class="mb-2 fw-600">Delivery keyboard</div>
        <div class="row-flex align-items-center mb-2">
          <p class="mr-2">External rows</p>
          <input-number width="148" :value="keyboardConfig.length" @input="changeExtraRows"/>
        </div>
      </div>
      <div class="col-6 col-flex h-100">
        <g-spacer/>
        <pos-order-delivery-keyboard :key="dialog" mode="edit" :keyboard-config="keyboardConfig" @edit:keyboard="openDialogEdit"/>
      </div>
    </div>
    <dialog-text-filter v-model="dialog" label="Enter key" @submit="changeKeyboardExtension"/>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "PosOrderDeliveryConfig",
    injectService: ['Snackbar:(showSnackbar)'],
    data() {
      return {
        keyboardConfig: [],
        position: {},
        dialog: false
      }
    },
    async created() {
      const setting = await cms.getModel('PosSetting').findOne()
      this.keyboardConfig = (setting && setting['keyboardDeliveryConfig']) || []
    },
    methods: {
      fetchMenu() {
        cms.socket.emit('getDeliveryProducts', () => {
          const contentFn = () => (
              <div style="margin: 0 auto">
                <span>Fetch menu successfully!</span>
              </div>);

          this.showSnackbar(contentFn, '#536dfe', 3000)
        })
      },
      changeExtraRows(val) {
        if(val > this.keyboardConfig.length) {
          this.keyboardConfig.unshift([' ', ' ', ' '])
        } else {
          this.keyboardConfig.shift()
        }
      },
      openDialogEdit(position) {
        this.position = position
        this.dialog = true
      },
      async changeKeyboardExtension(val) {
        _.set(this.keyboardConfig, [this.position.top, this.position.left], val)
        await cms.getModel('PosSetting').findOneAndUpdate(
            {},
            {
              keyboardDeliveryConfig: this.keyboardConfig
            }
        )
      },
      back() {
        this.$emit('update:view', {
          name: 'Functions'
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .delivery-config {
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
    }
  }
</style>
