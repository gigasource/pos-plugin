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
    <!-- Choice -->
    <div class="menu-setting-new-item__choices">
      <div v-for="(choice, i) in internalChoices"
           :key="i" class="menu-setting-new-item__choice"
           @mouseenter="toggleBtn(i)"
           @mouseleave="toggleBtn(i)">
        <!-- header -->
        <div class="ml-1">Type</div>
        <div class="ml-1">Select</div>
        <div class="ml-1">Choice</div>
        <div class="row-flex justify-between ml-1">
          <div>Option</div>
          <g-btn-bs text-color="#536DFE" @click="addOption(i)">+ Add</g-btn-bs>
        </div>
        <!-- value -->
        <g-checkbox v-model="choice.mandatory" color="#536DFE" label="Mandatory" @change="choice.mandatory = $event"/>
        <div>
          <g-radio-group v-model="choice.select" row>
            <g-radio small color="#536DFE" value="one" label="One"/>
            <g-radio small color="#536DFE" value="many" label="Many"/>
          </g-radio-group>
        </div>
        <g-text-field-bs v-model="choice.name" placeholder="CHOICE NAME"/>
        <div>
          <div class="choice-option-item" v-for="(option, iOpt) in choice.options" :key="iOpt">
            <div class="item-name col-8">
              <input :value="option.name" @input="e => editOption(i, iOpt, { name: e.target.value, price: option.price })"/>
            </div>
            <div class="item-price col-3">
              <input type="number" step="0.01" :value="option.price" :placeholder="$t('common.currency')"
                     @input="e =>  editOption(i, iOpt, { name: option.name, price: parseInt(e.target.value) })"/>
            </div>
            <div class="item-btn col-1" v-if="choice.options.length > 1">
              <g-icon size="12" color="#424242" @click="removeOption(i, iOpt)">icon-close</g-icon>
            </div>
          </div>
        </div>
        <div v-if="showDeleteBtn[i]" @click="removeChoice(i)" class="menu-setting-new-item__choice__delete-btn">
          <g-icon color="white" size="16">mdi-trash-can-outline</g-icon>
        </div>
      </div>
    </div>
    <!-- Action button -->
    <div style="display: flex; padding: 13px 8px; background-color: #FFF">
      <g-btn-bs @click="addChoice" border-color="#5E76FE" text-color="#5E76FE">+ Choice</g-btn-bs>
      <g-spacer/>
      <g-btn-bs @click="$emit('cancel')">Cancel</g-btn-bs>
      <g-btn-bs :disabled="isDisabledSave" width="80" background-color="#536DFE" text-color="white" @click="saveMenuItem">Save</g-btn-bs>
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
      },
      available: {
        type: Boolean,
        default: true
      },
      choices: {
        type: Array,
        default: () => []
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

      let internalChoices = _.cloneDeep(this.choices)
      let showDeleteBtn = internalChoices.map(() => false)

      return {
        internalId: this.id || '',
        internalName: this.name,
        internalDesc: this.desc,
        internalPrice: this.price,
        internalTax: this.tax || 7,
        internalImage: this.image,
        internalPrinter,
        taxes: [],
        internalChoices,
        showDeleteBtn,
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
      },
      isDisabledSave() {
        if(!this.internalName || isNaN(this.internalPrice) || !this.internalPrinter) return true
        if(this.internalChoices && this.internalChoices.length > 0) {
          for (const choice of this.internalChoices) {
            if(!choice.name) return true
            for (const option of choice.options) {
              if (!option.name || isNaN(option.price)) return true
            }
          }
        }
        return false
      }
    },
    methods: {
      async getAllTaxCategory() {
        const settings = await cms.getModel('PosSetting').findOne();
        return settings.taxCategory;
      },
      addChoice() {
        this.internalChoices.push({
          mandatory: false,
          select: "one",
          name: '',
          options: [{name: '', price: 0}]
        })
        this.showDeleteBtn.push(false)
      },
      addOption(choiceIndex) {
        this.internalChoices[choiceIndex].options.push({
          name: '',
          price: 0
        })
      },
      editOption(choiceIndex, optionIndex, { name, price }) {
        this.internalChoices[choiceIndex].options[optionIndex].name = name
        this.internalChoices[choiceIndex].options[optionIndex].price = +price
      },
      removeOption(choiceIndex, optionIndex) {
        if(this.internalChoices[choiceIndex].options.length === 1) return
        this.internalChoices[choiceIndex].options.splice(optionIndex, 1)
      },
      removeChoice(choiceIndex) {
        this.internalChoices.splice(choiceIndex, 1)
        this.showDeleteBtn.splice(choiceIndex, 1)
      },
      toggleBtn(index) {
        const value = this.showDeleteBtn[index]
        this.showDeleteBtn.splice(index, 1, !value)
      },
      getImage(url) {
        this.internalImage = url
      },
      saveMenuItem() {
        if (this.isDisabledSave) {
          alert('Not available to save!')
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
          showImage: this.showImage,
          available: this.available,
          choices: this.internalChoices.map(choice => ({...choice, name: choice.name.toUpperCase()}))
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

    &__choices {
    }
    
    &__choice {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr 2fr 2fr;
      grid-template-rows: 30px 1fr;
      padding: 16px 24px;
      background: #fafafa;
      border-bottom: 1px solid #efefef;
      font-size: 15px;
      
      &__delete-btn {
        position: absolute;
        top: 0;
        right: 0;
        background: #757575;
        border-radius: 2px;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      ::v-deep .g-checkbox-label,
      ::v-deep .g-radio-label {
        font-size: 14px;
        font-weight: 600;
        margin-left: 0;
        margin-bottom: 2px;
      }

      .bs-tf-wrapper ::v-deep .bs-tf-inner-input-group {
        background: white;

        .bs-tf-input {
          text-transform: uppercase;
          font-weight: 700;
          font-size: 14px;
          color: #1d1d26;
          width: 100%;
        }
      }

      .choice-option-item {
        display: flex;
        margin: 8px 5px;

        .item-name,
        .item-price {
          background: white;
          border: 1px solid #ced4da;
          padding: 6px;

          input {
            width: 100%;
            outline: none;
            line-height: 24px;
            padding: 0;
            margin: 0;
            font-size: 14px;
            font-weight: 700;
          }
        }

        .item-name {
          border-right: none;
          border-radius: 4px 0 0 4px;
          padding-left: 12px;
        }

        .item-price {
          border-radius: 0 4px 4px 0;
        }

        .item-btn {
          display: flex;
          align-items: center;
          margin-left: 12px;
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
