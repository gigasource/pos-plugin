<template>
  <div class="restaurant-info">
    <div class="restaurant-info__title">Store Information</div>
    <div class="restaurant-info__main" v-if="store">
      <div class="restaurant-info__main--left">
        <div>
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
        <div class="mt-3">
          <div class="mb-3 fw-700">Embed Code</div>
          <div>
            <g-textarea style="border: 1px solid #EFEFEF;color: #162D3D" no-resize :value="iframe"></g-textarea>
            <div class="row-flex align-items-center" style="cursor: pointer">
              <g-icon size="14" color="#536DFE" class="mr-1 mb-1">icon-chain-blue</g-icon>
              <span style="color: #536DFE; cursor: pointer" @click.stop="copyCode">Copy Code</span>
              <g-spacer/>
            </div>
          </div>
        </div>
      </div>
      <div class="restaurant-info__main--right">
        <div>
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
        <template>
          <div v-if="!store.faviconImageSrc">
            <div class="mb-2 fw-700">Upload Favicon</div>
            <div class="row-flex align-items-center">
              <div style="font-size: 15px; font-weight: 300; font-style: italic; color: #757575">
                Upload an icon for your online ordering website
              </div>
              <g-btn-bs style="margin-left: auto; margin-right: auto" @click="choosePhoto" icon="icon-upload_white" background-color="#536DFE" text-color="white">Upload</g-btn-bs>
            </div>
          </div>
          <div v-else class="row-flex align-items-center">
            <div class="mr-2">
              <div class="mb-2 fw-700">Upload Favicon</div>
              <div style="font-size: 15px; font-weight: 300; font-style: italic; color: #757575">
                Choose a favicon image to be displayed
              </div>
            </div>
            <div class="favicon">
              <img alt :src="cdnUrl(store.faviconImageSrc)" style="width: 60px; height: 60px"/>
              <div class="favicon--btn" @click="choosePhoto">
                <g-icon color="#000" size="20">photo_camera</g-icon>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
  import UploadZone from './UploadZone';
  import _ from 'lodash'
  import {getCdnUrl} from "../../Store/utils";

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
        // now we're currently support de and en
        countries: [
          {name: 'Germany', locale: 'de'},
          {name: 'United State', locale: 'en'},
          {name: 'United Kingdom', locale: 'en'},
          {name: 'Australia', locale: 'en'},
          {name: 'Canada', locale: 'en'},
          // {name: 'France', locale: 'fr'},
          // {name: 'Italy', locale: 'it'},
          {name: 'Singapore', locale: 'en'},
        ],
        country: this.store.country || ''
      }
    },
    injectService: ['FileUploadStore:(openUploadFileDialog, uploadImage, showFileUploadProgressDialog, uploadingItems)'],
    computed: {
      iframe() {
        const storeUrl = [location.origin, 'store', this.store.alias].join('/');
        return `<div id="webshop-embed-btn" class="webshop-embed-btn" data-url="${storeUrl}">Preview Webshop</div><script type="application/javascript" src="https://cdn.pos.gigasource.io/cms-files/files/download/js-scripts/webshop-embed.js"><\/script>`
      }
    },
    created() {
      this.updateDebounce = _.debounce(this.update, 1000)
    },
    methods: {
      async update(change) {
        this.$emit('update', change)
      },
      async copyCode() {
        await navigator.clipboard.writeText(this.iframe)
      },
      async choosePhoto() {
        this.openUploadFileDialog(async (file) => {
          const src = await this.uploadImage(file)
          this.$emit('update', {faviconImageSrc: src})
        })
        setTimeout(() => {
          this.showFileUploadProgressDialog = false
          this.uploadingItems = []
        }, 3000)
      },
      cdnUrl(url) {
        return `${getCdnUrl(url)}?w=60&h=60`
      }
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
      display: flex;

      &--left,
      &--right {
        flex: 0 0 calc(50% - 12px);

        .span-2 {
          grid-column: span 2;
        }

        & > div {
          background-color: #FFF;
          border-radius: 5px;
          padding: 24px;
          margin-bottom: 24px;
        }
      }

      &--left {
        margin-right: 12px;
      }

      &--right {
        margin-left: 12px;
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
          }

          .g-tf-append__inner {
            display: none;
          }

          textarea {
            user-select: text !important;
            max-height: 120px;
          }
        }
      }

      .g-select ::v-deep .bs-tf-label {
        font-size: 15px;
      }

      .bs-tf-wrapper ::v-deep .bs-tf-label {
        margin-bottom: 4px;
      }

      .favicon {
        position: relative;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        margin-left: auto;
        margin-right: auto;

        &--btn {
          position: absolute;
          bottom: -16px;
          right: -16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EFEFEF;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.40);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
      }
    }
  }
</style>
