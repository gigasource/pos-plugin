<template>
  <div class="restaurant-info">
    <div class="restaurant-info__title">Store Information</div>
    <div class="restaurant-info__main" v-if="store">
      <div>
        <div class="restaurant-info__main--left">
          <div class="mb-3 fw-700">Basic info</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto 1fr 1fr; grid-gap: 5px">
            <g-text-field-bs large label="Store Name"
                             placeholder="Store Name"
                             :value="store.name"
                             @input="updateDebounce({ name: $event })"/>
            <g-text-field-bs large label="Store Phone"
                             placeholder="Store Phone"
                             :value="store.phone"
                             @input="updateDebounce({ phone: $event })"/>
            <div class="span-2">
              <p>Store Address</p>
              <g-textarea outlined no-resize placeholder="Address..."
                          :rows="3"
                          :value="store.address"
                          @input="updateDebounce({ address: $event })"/>
            </div>
            <g-text-field-bs large label="Zip code"
                             :value="store.zipCode"
                             @input="updateDebounce({zipCode: $event})"/>
            <g-text-field-bs large label="Town/City"
                             :value="store.townCity"
                             @input="updateDebounce({townCity: $event})"/>
            <div class="span-2">
              <g-select returnObject item-text="name" text-field-component="GTextFieldBs" label="Country" :items="countries" v-model="country" @input="updateDebounce({country: $event})"/>
            </div>
          </div>
        </div>
      </div>
      <div class="restaurant-info__main--right">
        <div class="mb-3 fw-700">Upload photo</div>
        <div class="mb-5">
          <div class="mb-2">Store Photo</div>
          <upload-zone :url="store.orderHeaderImageSrc" @url="update({ orderHeaderImageSrc: $event })" :option="{maxWidth: 500, maxHeight: 500}" :aspect-ratio="2"/>
        </div>
        <div>
          <div class="mb-2">Store Logo</div>
          <upload-zone :url="store.logoImageSrc" @url="update({ logoImageSrc: $event })" :option="{maxHeight: 500, maxWidth: 500}"/>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import UploadZone from './UploadZone';
  import _ from 'lodash'
  
  // TODO:
  // - remove old image when user change to new image
  // - input debounce
  
  export default {
    name: 'RestaurantInformation',
    components: { UploadZone },
    props: {
      store: Object
    },
    data: function () {
      return {
        countries: [
          {name: 'Germany', locale: 'de'},
          {name: 'United State', locale: 'en'},
          {name: 'United Kingdom', locale: 'en'},
          {name: 'Australia', locale: 'en'},
          {name: 'Canada', locale: 'en'},
          {name: 'France', locale: 'fr'},
          {name: 'Italy', locale: 'it'},
          {name: 'Singapore', locale: 'en'},
        ],
        country: this.store.country || ''
      }
    },
    computed: {},
    created() {
      this.updateDebounce = _.debounce(this.update, 1000)
    },
    methods: {
      async update(change) {
        this.$emit('update', change)
      },
    }
  }
</script>

<style scoped lang="scss">
  .restaurant-info {
    font-size: 15px;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr;
      grid-gap: 20px;

      &--left,
      &--right {
        background-color: #FFF;
        border-radius: 5px;
        padding: 25px 25px 50px 25px;

        .span-2 {
          grid-column: span 2;
        }
      }

      .g-textarea {
        margin-right: 4px;
        width: calc(100% - 5px);

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
          }

          .g-tf-append__inner {
            display: none;
          }

          textarea {
            user-select: text !important;
          }
        }
      }

      .g-select ::v-deep .bs-tf-label {
        font-size: 15px;
      }

      .bs-tf-wrapper ::v-deep .bs-tf-label {
        margin-bottom: 4px;
      }
    }
  }
</style>
