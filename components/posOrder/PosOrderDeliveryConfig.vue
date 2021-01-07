<template>
  <div class="delivery-config">
    <div class="delivery-config__title">
      Configuration
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
          <input-number width="148" :model-value="keyboardDeliveryConfig.length" @update:modelValue="changeExtraRows"/>
        </div>
      </div>
      <div class="col-6 col-flex h-100">
        <g-spacer/>
        <pos-order-delivery-keyboard :key="dialog" mode="edit" :keyboard-config="keyboardDeliveryConfig" @edit:keyboard="openDialogEdit"/>
      </div>
    </div>
    <dialog-text-filter v-model="dialog" label="Enter key" @submit="changeKeyboardExtension"/>
  </div>
</template>

<script>
  import _ from 'lodash'
  import inputNumber from '../EditMenuCard/InputNumber'
  import posOrderDeliveryKeyboard from './posOrderDeliveryKeyboard';
  import dialogTextFilter from '../pos-shared-components/dialogFilter/dialogTextFilter';

  export default {
    name: "PosOrderDeliveryConfig",
    injectService: ['Snackbar:(showSnackbar)'],
    components: {posOrderDeliveryKeyboard, inputNumber, dialogTextFilter},
    data() {
      return {
        keyboardDeliveryConfig: [],
        position: {},
        dialog: false
      }
    },
    async created() {
      const setting = await cms.getModel('PosSetting').findOne()
      this.keyboardDeliveryConfig = (setting && setting.keyboardDeliveryConfig) || []
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
        if(val > this.keyboardDeliveryConfig.length) {
          this.keyboardDeliveryConfig.unshift([' ', ' ', ' '])
        } else {
          this.keyboardDeliveryConfig.shift()
        }
      },
      openDialogEdit(position) {
        this.position = position
        this.dialog = true
      },
      async changeKeyboardExtension(val) {
        _.set(this.keyboardDeliveryConfig, [this.position.top, this.position.left], val)
        await cms.getModel('PosSetting').findOneAndUpdate({}, { keyboardDeliveryConfig: this.keyboardDeliveryConfig })
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
