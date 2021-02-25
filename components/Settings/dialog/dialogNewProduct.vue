<template>
  <div>
    <g-dialog :key="'dialogNewProduct'+key" eager fullscreen scrollable v-model="dialogNewProduct">
      <div class="dialog-product w-100">
        <div class="form">
          <div class="title">
            {{$t('settings.createProduct')}}
          </div>
          <div class="input">
            <!--            Name-->
            <pos-text-field @click="openDialogDetail('name')" class="name-input" label="Name" placeholder="Product Name" required v-model="productName"/>
            <pos-select :items="categories" class="category-input" item-text="name" item-value="value" label="Product Category" required return-object v-model="productCategory"/>

            <!--            Tax-->
            <div class="input__tax">
              <p class="label">{{$t('common.tax')}} <span class="text-red">*</span></p>
              <div class="row-flex">
                <div :class="['tax', taxCategory && tax.value === taxCategory.value && 'selected__tax']" :key="i"
                     @click="selectTax(tax)"
                     v-for="(tax, i) in taxes">
                  {{tax.value}}%
                </div>
              </div>
            </div>
            <pos-text-field @click="openDialogDetail('id')" disabled :label="$t('article.productId')" :placeholder="$t('settings.productIdPlaceholder')" v-model="productID"/>
            <pos-text-field :key="'pPrice'+key" @click="openDialogDetail('price')" :label="$t('article.price')" :placeholder="$t('article.price')" required v-model="productPrice">
              <template v-slot:append>
                <span style="color: #1471ff">{{$t('common.currency')}}</span>
              </template>
            </pos-text-field>
            <pos-select :items="units" class="unit-input" :label="$t('article.unit')" v-model="unit"/>
            <pos-text-field @click="openDialogDetail('barcode')" class="barcode-input" label="Barcode/PLU" placeholder="Barcode" v-model="productBarcode">
              <template v-slot:append>
                <g-icon svg>icon-scanning_barcode</g-icon>
              </template>
            </pos-text-field>

            <div class="switch-input switch-input-1">
              <pos-switch dense v-model="favorite"/>
              <p class="switch-title">{{$t('settings.favourite')}}</p>
            </div>
            <div class="switch-input switch-input-2">
              <pos-switch dense v-model="itemIsVoucher"/>
              <p class="switch-title">{{$t('settings.itemIsVoucher')}}</p>
            </div>

            <div class="switch-input switch-input-3">
              <pos-switch dense v-model="active"/>
              <p class="switch-title">{{$t('settings.active')}}</p>
            </div>

            <div class="switch-input switch-input-1">
              <pos-switch dense v-model="nonRefundable"/>
              <p class="switch-title">{{$t('settings.nonRefundable')}}</p>
            </div>

            <div class="switch-input switch-input-2">
              <pos-switch dense v-model="showOnOrderScreen"/>
              <p class="switch-title">{{$t('settings.showOnOrderScreen')}}</p>
            </div>

            <div class="switch-input switch-input-3">
              <pos-switch dense v-model="manualPrice"/>
              <p class="switch-title">{{$t('settings.manualPrice')}}</p>
            </div>
          </div>
        </div>

<!--        <div class="accordion">-->
<!--          <g-expansion :items="expansions" accordion item-header="name" v-model="expansionItem">-->
<!--          </g-expansion>-->
<!--        </div>-->
        <g-toolbar absolute bottom color="grey lighten 3">
          <g-spacer/>
          <g-btn :uppercase="false" @click="back()" class="mr-2" outlined width="120">{{$t('ui.cancel')}}</g-btn>
          <g-btn :disabled="!valid" :uppercase="false" @click="submit" background-color="blue accent 3" flat text-color="white" width="120">{{$t('ui.submit')}}</g-btn>
        </g-toolbar>
      </div>
    </g-dialog>
    <g-dialog :key="'dialogNewProductDetail'+key" eager overlay-color="#6b6f82" overlay-opacity="0.95" v-model="dialogNewProductDetail" width="90%">
      <div class="dialog-product w-100">
        <div class="form__detail">
          <div class="input__detail">
            <div>
              <pos-text-field :rules="[rules.required]" @click="keyboardFocus = 'name'" :label="$t('article.name')" :placeholder="$t('settings.productName')" ref="name" required v-model="name"/>
            </div>
            <div>
              <pos-text-field @click="keyboardFocus = 'id'" :label="$t('article.productId')" :placeholder="$t('settings.productIdPlaceholder')" ref="productID" v-model="productID"/>
            </div>
            <div>
              <pos-text-field :rules="[rules.number, rules.required]" @click="keyboardFocus = 'price'" :label="$t('article.price')" :placeholder="$t('article.price')" ref="price" required v-model="price">
                <template v-slot:append>
                  <span style="color: #1471ff">{{$t('common.currency')}}</span>
                </template>
              </pos-text-field>
            </div>
            <div>
              <pos-text-field @click="keyboardFocus = 'barcode'" :label="$t('settings.barcode')" :placeholder="$t('article.barcode')" ref="barcode" v-model="barcode">
                <template v-slot:append>
                  <g-icon svg>icon-scanning_barcode</g-icon>
                </template>
              </pos-text-field>
            </div>
          </div>
          <div class="action">
            <g-btn :uppercase="false" @click="dialogNewProductDetail = false" class="mr-3" outlined width="120">{{$t('ui.cancel')}}</g-btn>
            <g-btn :uppercase="false" @click="save" background-color="blue accent 3" flat text-color="white" width="120">{{$t('ui.ok')}}</g-btn>
          </div>
        </div>
        <div class="bg-grey-lighten-1 pa-2">
          <pos-keyboard-full v-model="keyboard"/>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>

  export default {
    name: 'dialogNewProduct',
    injectService: [
      'SettingsStore:createNewProduct',
      'SettingsStore:getAllTaxCategory',
      'SettingsStore:getHighestProductOrder',
      'SettingsStore:selectedProduct',
      'SettingsStore:updateProduct',
      'SettingsStore:getHighestFavouriteProductOrder'
    ],
    data() {
      return {
        taxCategory: null,
        taxes: [],
        productCategory: null,
        categories: [],
        unit: null,
        units: ['box', 'pack'],
        productName: '',
        productID: '',
        productPrice: '',
        productBarcode: '',
        favorite: null,
        nonRefundable: null,
        active: null,
        showOnOrderScreen: null,
        itemIsVoucher: null,
        manualPrice: null,
        expansions: [
          { name: 'Multiple Unit' },
          { name: 'Attributes' },
          { name: 'More' },
        ],
        expansionItem: null,
        dialogNewProductDetail: false,
        rules: {
          number: value => !isNaN(value) || 'Must be a number',
          required: value => !!value || value === 0 || 'Required',
        },
        keyboardFocus: null,
        name: '',
        id: '',
        price: '',
        barcode: '',
        key: 0,
        isEditProduct: false,
        internalValue: false,
      }
    },
    props: {
      value: Boolean,
    },
    computed: {
      dialogNewProduct: {
        get() {
          return this.internalValue
        },
        set(val) {
          this.internalValue = val;
        }
      },
      keyboard: {
        get() {
          if (this.keyboardFocus) {
            return this[this.keyboardFocus];
          }
        },
        set(val) {
          this[this.keyboardFocus] = val;
        }
      },
      valid() {
        if (typeof this.rules.required(this.name) === 'string') {
          return false
        }
        if (typeof this.rules.required(this.taxCategory) === 'string') {
          return false
        }
        if (typeof this.rules.required(this.productCategory) === 'string') {
          return false
        }
        return !(typeof this.rules.required(this.price) === 'string'
          || typeof this.rules.number(this.price) === 'string');
      }
    },
    methods: {
      async loadData() {
        this.categories = (await cms.getModel('Category').find({name: {'$ne': 'Favourite'}})).map(c => ({
          ...c,
          value: c.name,
        }));
        this.taxes = (await this.getAllTaxCategory()).sort((a, b) => (a.value - b.value))
      },
      async open(isEdit) {
        this.isEditProduct = isEdit;
        await this.loadData();
        if (this.isEditProduct && this.selectedProduct) {
          const p = this.selectedProduct;
          //update new dialog
          this.productName = p.name;
          this.productCategory = this.categories.find(c => p.category && c._id === p.category._id);
          this.taxCategory = this.taxes.find(t => t.value === p.tax);
          this.productID = p.id;
          this.productPrice = '' + p.price;
          this.productBarcode = p.barcode;
          this.unit = p.unit;
          this.favorite = p.option && p.option.favorite;
          this.nonRefundable = p.option && p.option.nonRefundable;
          this.active = p.option && p.option.active;
          this.showOnOrderScreen = p.option && p.option.showOnOrderScreen;
          this.manualPrice = p.option && p.option.manualPrice;
          //update detail dialog
          this.name = this.productName;
          this.id = this.productID;
          this.price = this.productPrice;
          this.barcode = this.productBarcode;
        } else {
          this.productName = '';
          this.productCategory = null;
          this.taxCategory = null;
          this.productID = '';
          this.productPrice = '';
          this.productBarcode = '';
          this.unit = null;
          this.favorite = null;
          this.nonRefundable = null;
          this.active = null;
          this.showOnOrderScreen = null;
          this.manualPrice = null;
          this.name = '';
          this.id = '';
          this.price = '';
          this.barcode = '';
        }
        this.key++;
        this.keyboardFocus = null;
        this.dialogNewProduct = true;
      },
      back() {
        this.dialogNewProduct = false;
      },
      selectTax(tax) {
        this.taxCategory = tax;
      },
      openDialogDetail(textfield) {
        this.keyboardFocus = textfield;
        this.dialogNewProductDetail = true;
        setTimeout(() => {
          this.$refs[textfield].$refs.input.focus();
        }, 200);
      },
      save() {
        this.productName = this.name;
        this.productID = this.id;
        this.productPrice = this.price;
        this.productBarcode = this.barcode;
        this.dialogNewProductDetail = false;
      },
      async submit() {
        const maxOrder = await this.getHighestProductOrder(this.productCategory._id);
        const maxFavouriteOrder = await this.getHighestFavouriteProductOrder();
        const product = {
          name: this.productName,
          category: this.productCategory._id,
          tax: this.taxCategory.value,
          id: this.productID,
          price: parseFloat(this.productPrice),
          barcode: this.productBarcode,
          unit: this.unit,
          option: {
            favorite: this.favorite,
            nonRefundable: this.nonRefundable,
            active: this.active,
            showOnOrderScreen: this.showOnOrderScreen,
            manualPrice: this.manualPrice,
          },
          dateAdded: new Date()
        }
        this.dialogNewProduct = false;
        if (this.isEditProduct) {
          const hasFavouriteLayout = this.selectedProduct.layouts.find(layout => layout.favourite)
          const layouts = !hasFavouriteLayout && this.favorite
            ? [...this.selectedProduct.layouts, { color: '#FFFFFF', favourite: true, order: maxFavouriteOrder + 1 }]
            : this.selectedProduct.layouts

          Object.assign(product, { layouts })
          await this.updateProduct({ ...product, _id: this.selectedProduct._id })
        } else {
          const layouts = this.favorite
            ? [{ color: '#FFFFFF', order: maxOrder + 1 }, { color: '#FFFFFF', favourite: true, order: maxFavouriteOrder + 1 }]
            : [{ color: '#FFFFFF', order: maxOrder + 1 }]

          Object.assign(product, { layouts })
          await this.createNewProduct(product);
        }
      }
    },
    watch: {
      dialogNewProductDetail: function (val) {
        if (!val) {
          this.name = this.productName;
          this.id = this.productID;
          this.price = this.productPrice;
          this.barcode = this.productBarcode;
          this.key++;
        }
      },
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-product {
    display: flex;
    flex-direction: column;
    background-color: white;
    overflow-y: auto;

    .accordion {
      padding: 0 48px;

      .g-expansion-group {
        box-shadow: none;
        margin: 0;

        ::v-deep .g-expansion,
        ::v-deep .g-expansion > .g-expansion-header {
          border: none !important;
          padding: 0;
          font-size: 16px;
          line-height: 20px;
          min-height: 42px;
          font-weight: 700;

          .g-expansion-header-prepend {
            width: 16px;
            color: #919191;
          }
        }

        ::v-deep .g-expansion .g-expansion-content {
          background-color: white;
          border: none;

          .g-expansion-content-wrapper {
            border: none;
          }
        }
      }
    }

    .form {
      padding: 48px;

      .title {
        font-size: 16px;
        line-height: 20px;
        color: #1d1d26;
        font-weight: 700;
        margin-bottom: 16px;
      }

      .input {
        display: grid;
        grid-gap: 12px 4px;
        grid-template-columns: repeat(6, 1fr);
        grid-template-rows: repeat(4, auto);

        .g-select {
          ::v-deep .g-tf-wrapper {
            margin-top: 33px !important;
          }
        }

        .bs-tf-wrapper {
          margin: 4px 0 8px 0;
          width: calc(100% - 4px);
        }

        .name-input {
          grid-row: 1 / 2;
          grid-column: 1 / 3;
        }

        .category-input {
          grid-row: 1 / 2;
          grid-column: 3 / 5;
        }

        .input__tax {
          grid-row: 1 / 2;
          grid-column: 5 / 7;
        }

        .unit-input {
          grid-row: 2 / 3;
          grid-column: 3 / 5;
        }

        .barcode-input {
          grid-row: 2 / 3;
          grid-column: 5 / 7;
        }

        .switch-input {
          display: flex;
          align-items: center;

          &-1 {
            grid-column: 1 / 3;
          }

          &-2 {
            grid-column: 3 / 5;
          }

          &-3 {
            grid-column: 5 / 7;
          }

          .switch-title {
            margin-top: 12px;
            margin-left: 12px;
          }
        }

        .g-switch-wrapper {
          margin-top: 0;
          margin-left: 0;
        }

        &__tax {
          padding: 4px 0 8px 0;

          .label {
            font-size: 13px;
            line-height: 16px;
            font-weight: 400;
            margin-top: 5px;
          }

          .tax {
            background: #F0F0F0;
            border: 1px solid #C9C9C9;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 38px;
            margin: 8px;
            flex-grow: 1;

            &:first-child {
              margin-left: 0;
            }

            &:last-child {
              margin-right: 0;
            }
          }

          .selected__tax {
            position: relative;
            border-color: #1976D2;
            background: #E0F1FF;

            &:before {
              position: absolute;
              content: '\F12C';
              font-family: "Material Design Icons", sans-serif;
              top: 0;
              right: 0;
              color: #fff;
              transform: translate(50%, -50%);
              border-radius: 50%;
              background-color: #1976D2;
              line-height: 1;
            }
          }
        }
      }
    }

    .form__detail {
      padding: 16px;

      .input__detail {
        padding: 24px 128px;
        display: grid;
        grid-template-rows: repeat(2, minmax(100px, 1fr));
        grid-template-columns: 1fr 1fr;
        grid-gap: 16px 64px;
      }

      .action {
        display: flex;
        justify-content: flex-end;
      }
    }

    ::v-deep .g-btn__outlined {
      border: 1px solid #979797;
      color: #1d1d26;
    }
  }
</style>
