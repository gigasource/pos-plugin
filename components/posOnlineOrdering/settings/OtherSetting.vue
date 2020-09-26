<template>
  <div class="other">
    <div class="other__title">{{$t('setting.otherSetting')}}</div>
    <div class="other__main">
      <div class="other__main--article">
        <p>{{$t('setting.digitalMenuScript')}}</p>
        <g-textarea rows="8" outlined no-resize v-model="script"/>
        <div class="row-flex justify-end">
          <g-btn-bs background-color="#1271ff" @click="uploadScript">{{$t('setting.upload')}}</g-btn-bs>
        </div>
      </div>
      <div class="other__main--article">
        <p>{{$t('setting.deliveryForwarding')}}</p>
        <div class="row-flex align-items-center">
          <span class="fs-small fw-700 mr-3">{{$t('setting.deliveryOrderForwarding')}}</span>
          <g-switch v-model="activeForward"/>
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
      <div v-if="!store.delivery" class="other__main--article">
        <p>Affiliate Delivery</p>
        <div class="row-flex align-items-center">
          <span class="fs-small fw-700 mr-3 col-3">Active</span>
          <g-switch v-model="activeAffiliate"/>
        </div>
        <div class="row-flex align-items-center my-3">
          <span class="fs-small fw-700 mr-3 col-3">Affiliate URL</span>
          <g-text-field-bs style="margin: 0" large v-model="url"/>
        </div>
        <div class="fs-small"><b>Current month:</b> {{affiliateDelivery.currentMonthCounter || 0}}</div>
        <div class="fs-small"><b>Last month:</b> {{affiliateDelivery.lastMonthCounter || 0}}</div>
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
        affiliateDelivery: (this.store && this.store.affiliateDelivery) || {},
      }
    },
    created() {
      this.updateStoreIdDebounce = _.debounce(this.updateStoreId, 1000)
      this.updateAffiliateUrlDebounce = _.debounce(this.updateAffiliateUrl, 1000)
    },
    computed: {
      activeForward: {
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
      },
      activeAffiliate: {
        get() {
          if(this.affiliateDelivery)
            return this.affiliateDelivery.active
          else
            return false
        },
        set(val) {
          this.$set(this.affiliateDelivery, 'active', val)
          this.updateAffiliateDelivery()
        }
      },
      url: {
        get() {
          if(this.affiliateDelivery)
            return this.affiliateDelivery.url
          else
            return ''
        },
        set(val) {
          this.updateAffiliateUrlDebounce(val)
        }
      },
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
      },
      updateAffiliateDelivery() {
        this.$emit('update', { affiliateDelivery: this.affiliateDelivery })
      },
      updateAffiliateUrl(value) {
        if(!value) return
        this.$set(this.affiliateDelivery, 'url', value)
        this.updateAffiliateDelivery()
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
      display: grid;
      grid-template-rows: 1fr 1fr;
      grid-template-columns: 1fr 1fr;
      grid-gap: 24px;

      &--article {
        background-color: #FFF;
        border-radius: 5px;
        padding: 24px;

        & > p {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 12px;
        }

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
    }
  }
</style>
