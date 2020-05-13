<template>
  <div class="menu-setting-new-item">
    <!-- Product info -->
    <div class="menu-setting-new-item__main">
      <div class="ta-center">{{ index + 1 }}</div>
      <upload-zone class="menu-setting-new-item__image" @url="getImage" :option="{maxHeight: 500, maxWidth: 500}" :aspect-ratio="1">
        <template v-slot:default="{showUploadDialog}">
          <img @click="showUploadDialog()" v-if="internalImage" :src="`${internalCdnImage}?w=80&h=80`" draggable="false" style="opacity: 0.8; width: 100%; height: 100%"/>
          <div @click="showUploadDialog()" v-else class="menu-setting-new-item__image--upload">
            <img alt src="/plugins/pos-plugin/assets/upload.svg"/>
            <p>Upload</p>
          </div>
        </template>
      </upload-zone>
      <div class="menu-setting-new-item__content">
        <div class="menu-setting-new-item__content--upper">
          <div class="col-1">
            <g-text-field-bs small v-model="internalId" type="text" placeholder="No."/>
          </div>
          <div class="flex-equal">
            <g-text-field-bs small v-model="internalName"  placeholder="Name *"/>
          </div>
          <div class="col-3" v-if="useMultiplePrinters">
            <g-select small text-field-component="GTextFieldBs" v-model="internalPrinter" :items="internalAvailablePrinters"/>
          </div>
          <div class="col-2">
            <g-text-field-bs small v-model="internalPrice" type="number" placeholder="Price *"/>
          </div>
        </div>
        <div class="menu-setting-new-item__content--lower">
          <div class="col-9">
            <g-textarea outlined no-resize :rows="2" v-model="internalDesc" placeholder="Description"/>
          </div>
          <div class="col-3">
            <div class="menu-setting-new-item__tax">
              <div>Tax:</div>
              <div>
                <g-grid-select mandatory :value="internalTax" :items="taxes" :itemCols="Math.round(12/taxes.length)">
                  <template #default="{ toggleSelect, item, index }">
                    <div class="option" @click="e =>{ toggleSelect(item); internalTax = item.value;}">
                      {{item.text}}
                    </div>
                  </template>
                  <template #selected="{ toggleSelect, item, index }">
                    <div class="option option--selected" @click="e => {toggleSelect(item); internalTax = item.value;}">
                      {{item.text}}
                    </div>
                  </template>
                </g-grid-select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Action button -->
    <div style="display: flex; justify-content: flex-end; margin: 4px 8px">
      <g-btn-bs @click="$emit('cancel')">Cancel</g-btn-bs>
      <g-btn-bs :disabled="!internalName || isNaN(internalPrice) || !internalPrinter" width="80" background-color="#536DFE" text-color="white" @click="saveMenuItem">Save</g-btn-bs>
    </div>
  </div>
</template>
<script>
  import _ from 'lodash'
  import { getCdnUrl } from '../../Store/utils';
  import UploadZone from "./UploadZone";

  export default {
    name: 'NewMenuItem',
    components: {UploadZone},
    props: {
      id: String,
      index: Number,
      name: String,
      desc: String,
      price: [String, Number],
      tax: Number,
      image: String,
      number: Number,
      groupPrinters: Array,
      availablePrinters: Array,
      useMultiplePrinters: Boolean,
      showImage: {
        type: Boolean,
        default: true
      }
    },
    data: function () {
      let internalPrinter
      if (this.useMultiplePrinters) {
        internalPrinter = (this.groupPrinters && this.groupPrinters[0]) || null
      } else {
        // availablePrinters is not an empty array
        internalPrinter = (this.groupPrinters && this.groupPrinters[0]) || this.availablePrinters[0]
      }

      return {
        internalId: this.id || '',
        internalName: this.name,
        internalDesc: this.desc,
        internalPrice: this.price,
        internalTax: this.tax || 7,
        internalImage: this.image,
        internalPrinter,
        taxes: [],
      }
    },
    async created() {
      this.taxes = (await this.getAllTaxCategory()).map(tax => ({
        text: tax.value + '%',
        value: tax.value
      }))
      const inputNumber = document.querySelectorAll('input[type=number]')
      for(const input of inputNumber) {
        input.step = 0.01
      }
    },
    computed: {
      internalAvailablePrinters() {
        return _.map(this.availablePrinters, printer => ({ text: printer, value: printer }))
      },
      internalCdnImage() {
        return getCdnUrl(this.internalImage)
      }
    },
    methods: {
      async getAllTaxCategory() {
        const settings = await cms.getModel('PosSetting').findOne();
        return settings.taxCategory;
      },
      getImage(url) {
        this.internalImage = url
      },
      saveMenuItem() {
        if (!this.internalName) {
          alert('Product name is missing')
          return
        }

        if (!this.internalPrice) {
          alert('Product\'s price is missing')
          return
        }

        if (!this.internalPrinter) {
          alert('Product\'s printer is missing')
          return
        }

        if(isNaN(this.internalPrice)) {
          alert('Product\'s price must be a number')
          return
        }

        this.$emit('save', {
          id: this.internalId,
          image: this.internalImage,
          name: this.internalName,
          desc: this.internalDesc,
          groupPrinters: this.internalPrinter,
          price: this.internalPrice,
          tax: this.internalTax,
          showImage: this.showImage
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .menu-setting-new-item {
    background: #FFF;

    &__main {
      display: grid;
      grid-template-columns: 40px 80px 1fr;
      grid-gap: 15px;
      align-items: center;
    }

    &__content {
      padding-right: 16px;

      &--upper,
      &--lower {
        display: flex;
        margin-top: 4px;
      }

      .g-textarea {
        margin: 0 2px;
        width: calc(100% - 4px);

        ::v-deep fieldset {
          border-width: 1px !important;
          border-color: #ced4da;

          &:focus-within {
            border-color: #80bdff !important;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
            z-index: 2;
          }

          .g-tf-input {
            padding: 6px;
            line-height: 18px !important;
            height: 40px !important;
          }

          .g-tf-append__inner {
            display: none;
          }
        }
      }

      .g-select {
        ::v-deep .bs-tf-wrapper {
          margin: 0 2px;
          width: calc(100% - 4px);

          .bs-tf-inner-input-group {
            height: 30px;
            font-size: 14px;
            line-height: 28px;
            max-width: 100%;
            padding-right: 6px;

            .bs-tf-input {
              display: none;
            }

            .input {
              height: 28px;
              display: flex;
              overflow: scroll hidden;
              width: calc(100% - 24px);
              scrollbar-width: none; // firefox

              &::-webkit-scrollbar {
                display: none;
              }
            }
          }
        }
      }

      .bs-tf-wrapper {
        margin: 0 2px;
        width: calc(100% - 4px);

        ::v-deep .bs-tf-inner-input-group {
          padding: 0 6px;

          input[type=number] {
            margin: 0 -6px;
            padding-left: 6px;
            padding-right: 6px;
            -moz-appearance: textfield;
            outline: none;
            user-select: text;

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
          }
        }

        ::v-deep .bs-tf-input {
          width: 100%;
          outline: none;
          margin: 0;
        }
      }

    }

    &__image {
      width: 80px;
      height: 80px;
      border-radius: 15px;
      cursor: pointer;
      border: 1px dashed #B1B5BA;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      &--upload {
        opacity: 0.8;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 16px;
        color: #E0E0E0;

        img {
          width: 60%;
        }
      }
    }

    &__tax {
      border: 1px solid #ced4da;
      border-radius: 4px;
      margin: 0 2px;
      padding: 0 4px 3px;
      font-size: 13px;

      .option {
        padding: 0px 8px;
        text-align: center;
        font-size: 15px;
        font-style: italic;
        border-radius: 2px;
        border: 1px solid #E0E0E0;
        margin-right: 4px;
        cursor: pointer;

        &--selected {
          border-color: #90CAF9;
          background-color: #E3F2FD;
        }
      }

      ::v-deep .g-col {
        padding: 0;
      }
    }
  }
</style>
