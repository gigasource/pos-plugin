<template>
  <g-dialog v-model="value" @input="close">
    <div class="dlg-feature-control">
      <div class="dlg-feature-control__title">Feature control</div>
      <div class="dlg-feature-control__header">
        <span class="dlg-feature-control__header__group">{{store.name}}</span>
        <g-spacer/>
        <span class="dlg-feature-control__header__device-info">{{deviceInfo}}</span>
      </div>
      <div class="dlg-feature-control__body row-flex">
        <div class="col-6">
          <g-switch v-model="features.fastCheckout" label="Fast Checkout"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.manualTable" label="Manual Table"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.delivery" label="Delivery"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.editMenuCard" label="Edit Menu Card"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.tablePlan" label="Table Plan"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.editTablePlan" label="Edit Table Plan"/>
        </div>
        <div class="dlg-feature-control__body__line"></div>
        <div class="col-12">
          <g-switch :disabled="!canUseFeature('onlineOrdering')" v-model="features.onlineOrdering" label="Online Ordering"/>
          <div style="font-size: 12px;">Note: Only one device can connect to online ordering at a time.</div>
        </div>
        <div class="dlg-feature-control__body__line"></div>
        <div class="col-12">
          <g-switch :disabled="!canUseFeature('reservation')" v-model="features.reservation" label="Reservation"/>
          <div style="font-size: 12px;">Note: Only one device can connect to reservation service at a time.</div>
        </div>
        <div class="dlg-feature-control__body__line"></div>
        <div class="col-6">
          <g-switch v-model="features.staffReport" label="Staff Report"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.eodReport" label="End of Day"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.monthlyReport" label="Monthly Report"/>
        </div>
        <div class="dlg-feature-control__body__line"></div>
        <div class="col-6">
          <g-switch v-model="features.remoteControl" label="Remote Control"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.proxy" label="Proxy"/>
        </div>
        <div class="col-6">
          <g-switch v-model="features.alwaysOn" label="Always-on"/>
        </div>
      </div>
      <div class="dlg-feature-control__actions">
        <g-btn-bs @click="close">Cancel</g-btn-bs>
        <g-btn-bs background-color="#536DFE" text-color="#FFF" @click="save">Save</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  import _ from 'lodash'

  export default {
    name: 'dialogFeatureControl',
    props: {
      value: Boolean,
      device: Object,
      store: Object
    },
    data: function () {
      return {}
    },
    computed: {
      deviceInfo() {
        return `${this.device.name}, ${this.device.hardware}, ${this.device.appName}, ${this.device.appVersion}, ${this.device.appRelease}`
      },
      features() {
        return _.cloneDeep(this.device.features)
      }
    },
    methods: {
      close() {
        this.$emit('input', false)
      },
      save() {
        this.$emit('save', this.features)
      },
      canUseFeature(feature) {
        const device = _.find(this.store.devices, d => d.features[feature])
        return device == null || device._id === this.device._id
      },
    }
  }
</script>
<style scoped lang="scss">
  .dlg-feature-control {
    padding: 40px;
    background: #FFF;
    border-radius: 4px;
    width: 580px;
    margin: 0 auto;
    
    &__title {
      font-weight: 600;
      font-size: 24px;
      color: #212121;
      margin-bottom: 20px;
    }
    
    &__header {
      display: flex;
      margin-bottom: 10px;
      
      &__group {
        font-weight: bold;
        font-size: 16px;
      }
      
      &__device-info {
        font-size: 14px;
        color: #201F2B;
      }
    }
    
    &__body {
      flex-wrap: wrap;
      margin-bottom: 40px;
      
      &__line {
        background: #EFEFEF;
        height: 1px;
        width: 100%;
        margin: 15px 0;
      }
    }
    
    &__actions {
      display: flex;
      justify-content: flex-end;
    }
  }
</style>
