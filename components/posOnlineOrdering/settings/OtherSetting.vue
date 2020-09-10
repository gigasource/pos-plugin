<template>
  <div class="other">
    <div class="other__title">{{$t('setting.otherSetting')}}</div>
    <div class="other__main">
      <div class="other__main--left">
        <p>{{$t('setting.digitalMenuScript')}}</p>
        <g-textarea rows="8" outlined no-resize v-model="script"/>
        <div class="row-flex justify-end">
          <g-btn-bs background-color="#1271ff" @click="uploadScript">{{$t('setting.upload')}}</g-btn-bs>
        </div>
      </div>
      <div class="other__main--right">
        <p>{{$t('setting.deliveryForwarding')}}</p>
        <div class="row-flex align-items-center">
          <span class="fs-small fw-700 mr-3">{{$t('setting.deliveryOrderForwarding')}}</span>
          <g-switch v-model="active"/>
        </div>
        <div class="row-flex align-items-center my-3">
          <span class="fs-small fw-700 mr-3" style="white-space: nowrap">{{$t('setting.forwardToRestaurant')}}</span>
          <g-text-field-bs style="margin: 0" large type="number" v-model="storeId"/>
        </div>
        <span>
          <b>{{$t('store.note')}}: </b>
          <span>{{$t('setting.forwardNote')}}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "OtherSetting",
    props: {
      store: Object
    },
    data() {
      return {
        script: (this.store && this.store.digitalMenuScript) || '',
        deliveryForward: (this.store && this.store.deliveryForward) || {},
      }
    },
    created() {
      this.updateStoreIdDebounce = _.debounce(this.updateStoreId, 1000)
    },
    computed: {
      active: {
        get() {
          if(this.deliveryForward)
            return this.deliveryForward.active
          else
            return false
        },
        set(val) {
          this.$set(this.deliveryForward, 'active', val)
          this.updateDeliveryForward()
        }
      },
      storeId: {
        get() {
          if(this.deliveryForward)
            return this.deliveryForward.storeId
          else
            return ''
        },
        set(val) {
          this.updateStoreIdDebounce(val)
        }
      }
    },
    methods: {
      uploadScript() {
        this.$emit('update', {digitalMenuScript: this.script})
      },
      updateDeliveryForward() {
        this.$emit('update', { deliveryForward: this.deliveryForward })
      },
      updateStoreId(value) {
        if (!value || isNaN(value)) return
        this.$set(this.deliveryForward, 'storeId', value)
        this.updateDeliveryForward()
      }
    }
  }
</script>

<style scoped lang="scss">
  .other {

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__main {
      display: flex;

      &--left,
      &--right {
        background-color: #FFF;
        border-radius: 5px;
        padding: 24px;
        margin-bottom: 24px;

        & > p {
          font-size: 16px;
          font-weight: bold;
        }
      }

      &--left {
        flex: 0 0 calc(50% - 6px);
        margin-right: 6px;

        .g-textarea {
          margin-right: 4px;
          width: calc(100% - 5px);

          ::v-deep .g-tf {
            &:before, &:after {
              display: none;
            }
          }

          ::v-deep fieldset {
            border-width: 1px !important;
            border-color: #ced4da;

            &:focus-within {
              border-color: #80bdff !important;
              box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
              z-index: 2;
            }

            .g-tf-input {
              padding: 12px;
              font-size: 15px;
              user-select: text !important;
              line-height: 1.2 !important;
            }

            .g-tf-append__inner {
              display: none;
            }
          }
        }
      }

      &--right {
        flex: 0 0 calc(50% - 6px);
        margin-left: 6px;
      }
    }
  }
</style>
