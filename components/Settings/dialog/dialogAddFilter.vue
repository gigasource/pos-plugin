<template>
  <g-dialog v-model="dialogAddFilter" width="90%" eager>
    <div class="dialog-add-filter w-100">
      <div class="dialog-add-filter__title">Add Filter</div>
      <g-tabs v-model="tab" :items="tabItems" text-color="#1d1d26" color="white" active-text-color="#1d1d26"
              slider-color="#1471ff" slider-size="3">
        <g-tab-item :item="tabItems[0]">
          <div class="screen">
            <pos-text-field v-model="productId" label="Product ID"/>
            <g-btn :uppercase="false" text @click="dialogAddFilter = false" outlined width="120" class="mr-2">
              {{$t('ui.cancel')}}
            </g-btn>
            <g-btn :uppercase="false" text @click="addProductIdFilter" backgroundColor="#2979FF" text-color="#FFFFFF"
                   width="120">
              {{$t('ui.ok')}}
            </g-btn>
          </div>
          <div class="keyboard" style="padding: 24px 30%">
            <pos-numpad v-model="productId"/>
          </div>
        </g-tab-item>
        <g-tab-item :item="tabItems[1]">
          <div class="screen">
            <pos-text-field v-model="name" label="Name"/>
            <g-btn :uppercase="false" text @click="dialogAddFilter = false" outlined width="120" class="mr-2">
              {{$t('ui.cancel')}}
            </g-btn>
            <g-btn :uppercase="false" text @click="addNameFilter" backgroundColor="#2979FF" text-color="#FFFFFF"
                   width="120">
              {{$t('ui.ok')}}
            </g-btn>
          </div>
          <div class="keyboard">
            <pos-keyboard-full v-model="name"/>
          </div>
        </g-tab-item>
        <g-tab-item :item="tabItems[2]">
          <pos-range-slider min="0" max="1000" v-model="price"/>
          <div class="range-value">
            <span>0</span>
            <span>{{$t('common.currency', storeLocale)}} 1000</span>
          </div>
          <div class="buttons">
            <g-btn :uppercase="false" text @click="dialogAddFilter = false" outlined width="120"
                   style="margin-right: 8px">{{$t('ui.cancel')}}
            </g-btn>
            <g-btn :uppercase="false" text @click="addPriceFilter" backgroundColor="#2979FF" text-color="#FFFFFF"
                   width="120">{{$t('ui.ok')}}
            </g-btn>
          </div>
        </g-tab-item>
        <g-tab-item :item="tabItems[3]">
          <div class="screen">
            <pos-text-field v-model="category" label="Category"/>
            <g-btn :uppercase="false" text @click="dialogAddFilter = false" outlined width="120" class="mr-2">
              {{$t('ui.cancel')}}
            </g-btn>
            <g-btn :uppercase="false" text @click="addCategoryFilter" backgroundColor="#2979FF" text-color="#FFFFFF"
                   width="120">
              {{$t('ui.ok')}}
            </g-btn>
          </div>
          <div class="keyboard">
            <pos-keyboard-full v-model="category"/>
          </div>
        </g-tab-item>
        <g-tab-item :item="tabItems[4]">
          <div class="screen">
            <pos-text-field v-model="barcode" label="Barcode"/>
            <g-btn :uppercase="false" text @click="dialogAddFilter = false" outlined width="120" class="mr-2">
              {{$t('ui.cancel')}}
            </g-btn>
            <g-btn :uppercase="false" text @click="addBarcodeFilter" backgroundColor="#2979FF" text-color="#FFFFFF"
                   width="120">
              {{$t('ui.ok')}}
            </g-btn>
          </div>
          <div class="keyboard" style="padding: 24px 30%">
            <pos-numpad v-model="barcode"/>
          </div>
        </g-tab-item>
      </g-tabs>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogAddFilter",
    injectService: [
        'SettingsStore:findCategoryByName', 'PosStore:storeLocale'
    ],
    props: {
      value: Boolean,
    },
    data() {
      return {
        tab: null,
        tabItems: [
          {title: 'Product ID'},
          {title: 'Name'},
          {title: 'Price'},
          {title: 'Category'},
          {title: 'Barcode'}
        ],
        productId: '',
        name: '',
        price: [0, 0],
        category: '',
        barcode: ''
      }
    },
    computed: {
      dialogAddFilter: {
        get() {
          return this.value
        },
        set(val) {
          this.productId = ''
          this.name = ''
          this.price = [0, 0]
          this.category = ''
          this.barcode = ''
          this.tab = this.tabItems[0]
          this.$emit('input', val)
        }
      }
    },
    methods: {
      addProductIdFilter() {
        if (this.productId) {
          const filter = {
            title: 'Product ID',
            text: this.productId,
            condition: {id: this.productId}
          }
          this.$emit('submit', filter)
        }
        this.dialogAddFilter = false
      },
      addNameFilter() {
        if (this.name) {
          const filter = {
            title: 'Name',
            text: this.name,
            condition: {name: {"$regex": this.name, "$options": 'i'}}
          }
          this.$emit('submit', filter)
        }
        this.dialogAddFilter = false
      },
      addPriceFilter() {
        if(this.price[1] > 0) {
          const filter = {
            title: 'Price',
            text: this.price[0] + ' - ' + this.price[1],
            condition: {price: { '$gte': this.price[0], '$lte': this.price[1] }}
          }
          this.$emit('submit', filter)
        }
        this.dialogAddFilter = false
      },
      async addCategoryFilter() {
        if(this.category) {
          const category = await this.findCategoryByName(this.category);
          const ids = category.map(c => c._id);
          const filter = {
            title: 'Category',
            text: this.category,
            condition: {"category": {"$in": ids}}
          }
          this.$emit('submit', filter)
        }
        this.dialogAddFilter = false
      },
      addBarcodeFilter() {
        if (this.barcode) {
          const filter = {
            title: 'Barcode',
            text: this.barcode,
            condition: {bookingNumber: {"$regex": this.barcode}}
          }
          this.$emit('submit', filter)
        }
        this.dialogAddFilter = false
      },
    }
  }
</script>

<style scoped lang="scss">
  .dialog-add-filter {
    background-color: white;

    &__title {
      margin: 24px;
      font-weight: 700;
    }

    ::v-deep .g-tabs {
      margin: 0 24px;

      &-bar {
        border-bottom: 0.5px solid #9E9E9E;
      }

      .g-tab {
        text-transform: capitalize;

        &:hover:before {
          display: none;
        }

        &__active {
          font-weight: 700;
        }
      }
    }

    ::v-deep .g-tab-items {
      .g-tab-item {
        min-height: 400px;
        display: flex;
        flex-direction: column;
      }
    }

    .screen {
      flex: 1;
      display: flex;
      padding: 24px 24px 60px;

      .bs-tf-wrapper {
        margin: 0 96px 0 4px;

        ::v-deep .bs-tf-message {
          margin-top: 0;
        }
      }

      .g-btn {
        margin-top: 30px;
      }
    }

    .keyboard {
      background: #bdbdbd;
      padding: 24px;
    }

    .range-value {
      display: flex;
      padding: 0 12px 0 24px;
      margin-top: -24px;
      justify-content: space-between;
    }

    .buttons {
      display: flex;
      flex: 3;
      justify-content: flex-end;
      align-items: flex-start;
      padding: 24px;
    }
  }
</style>
