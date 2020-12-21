<template>
  <div style="height: 100%">
    <g-simple-table striped fixed-header>
      <thead>
      <tr>
        <th></th>
        <th class="ta-left" @click="openIDFilters">
          {{$t('article.productId')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th class="ta-left" @click="openNameFilters">
          {{$t('article.name')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-right" @click="openPriceFilters">
          {{$t('article.price')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th @click="openCategoryFilters">
          {{$t('article.category')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th @click="openBarcodeFilters">
          {{$t('article.barcode')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
      </tr>
      </thead>
      <tr class="sticky">
        <td class="bg-grey-lighten-1">
          <g-checkbox v-if="products && products.length !== 0" v-model="selectedProductIDs" :value="listIDs" multiple>
            <template v-slot:label>
              <g-icon size="16" class="mb-1">fas fa-caret-down</g-icon>
            </template>
          </g-checkbox>
          <g-checkbox v-else/>
        </td>
        <td colspan="6" class="filter-wrapper" style="height: 48px">
          <div class="filter">
            {{$t('settings.filter')}}
            <div class="group-chip">
              <g-chip v-for="(filter, i) in productFilters" :key="filter.title+i" label small background-color="white" close class="ma-1" @close="removeFilter(filter)">
                <div>
                  <span class="chip-title">{{filter.title}}: </span>
                  <span class="chip-content">'{{filter.text}}'</span>
                </div>
              </g-chip>
            </div>
            <g-btn :uppercase="false" text v-if="productFilters && productFilters.length > 0" @click="clearFilter"><u>{{$t('settings.clearAll')}}</u></g-btn>
            <g-spacer/>
            <div class="btn-add-filter" @click="dialogAddFilter = true">+ Add Filter</div>
          </div>
        </td>
      </tr>
      <tr v-for="(product, i) in products" :key="i">
        <td>
          <g-checkbox v-model="selectedProductIDs" :value="product._id" @change="getFirstSelectedProduct"/>
        </td>
        <td class="ta-center" @click.stop="selectProduct(product)">{{product.id}}</td>
        <td @click.stop="selectProduct(product)">{{product.name}}</td>
        <td class="ta-right" @click.stop="selectProduct(product)">€ {{product.price.toFixed(2)}}</td>
        <td class="ta-center" @click.stop="selectProduct(product)">{{product.category && product.category.name}}</td>
        <td class="ta-center" @click.stop="selectProduct(product)">{{product.barcode}}</td>


      </tr>
    </g-simple-table>
    <pos-table-pagination @execQueryByPage="updatePagination"
                          :total-document="totalProducts"
                          v-model:limit="limit"
                          v-model:current-page="currentPage"
                          :selected="selectedProductIDs.length"/>
    <dialog-add-filter v-model="dialogAddFilter" @submit="addFilter"/>
  </div>
</template>

<script>
  export default {
    name: 'viewArticle',
    injectService: [
      'SettingsStore:(getListProducts, listProducts, productFilters, selectedProductIDs, totalProducts, getTotalProducts, productPagination, selectedProduct, updateProductFilters)',
    ],
    data() {
      return {
        dialogAddFilter: false
      }
    },
    computed: {
      products() {
        return this.listProducts
      },
      listIDs() {
        return this.listProducts.map(p => p._id);
      },
      limit: {
        get() {
          return this.productPagination.limit;
        },
        set(val) {
          this.productPagination.limit = val;
        }
      },
      currentPage: {
        get() {
          return this.productPagination.currentPage
        },
        set(val) {
          this.productPagination.currentPage = val
          this.selectedProductIDs = []
          this.selectedProduct = null
        }
      }
    },
    watch: {
      async limit() {
        await this.getListProducts();
      },
      async currentPage() {
        await this.getListProducts();
      },
    },
    methods: {
      async addFilter(filter) {
        this.updateProductFilters(filter)
        await this.getTotalProducts()
        await this.getListProducts()
      },
      async clearFilter() {
        this.productFilters = [];
        await this.getTotalProducts();
        await this.getListProducts();
      },
      async removeFilter(filter) {
        const index = this.productFilters.findIndex(f => f.title === filter.title);
        this.productFilters.splice(index, 1)
        await this.getTotalProducts();
        await this.getListProducts();
      },
      openIDFilters() {
        this.$getService('dialogProductIDFilter:setActive')(true);
      },
      openBarcodeFilters() {
        this.$getService('dialogProductBarcodeFilter:setActive')(true);
      },
      openNameFilters() {
        this.$getService('dialogProductNameFilter:setActive')(true);
      },
      openPriceFilters() {
        this.$getService('dialogProductPriceFilter:setActive')(true);
      },
      openCategoryFilters() {
        this.$getService('dialogProductCategoryFilter:setActive')(true);
      },
      async updatePagination() {
        await this.getListProducts();
      },
      selectProduct(product) {
        const index = this.selectedProductIDs.findIndex(p => p === product._id);
        if (index === -1) {
          this.selectedProductIDs.push(product._id);
        } else {
          this.selectedProductIDs.splice(index, 1);
        }
        this.getFirstSelectedProduct()
      },
      getFirstSelectedProduct() {
        if (this.selectedProductIDs.length > 0) {
          this.selectedProduct = this.listProducts.find(p => p._id === this.selectedProductIDs[0])
        } else {
          this.selectedProduct = null;
        }
      }
    },
    async created() {
      await this.getTotalProducts();
      await this.getListProducts();
    },
    beforeDestroy() {
      this.selectedProductIDs = [];
    }
  }
</script>

<style scoped lang="scss">
  .g-table {
    height: calc(100% - 64px);
    margin-left: 1px;

    ::v-deep table {
      table-layout: fixed;
    }

    thead tr th {
      font-size: 14px;
      color: #1d1d26;
      padding: 0 8px;
      background-color: #fff;
      cursor: pointer;
    }

    tr td {
      padding: 0 8px;
      font-size: 13px;
      line-height: 16px;
      height: 33px
    }

    tr td:first-child,
    tr th:first-child {
      padding-right: 0;
    }

    tr {
      td:nth-child(1),
      th:nth-child(1) {
        width: 6%;
      }

      td:nth-child(2):not(.filter-wrapper),
      th:nth-child(2) {
        width: 17%;
      }

      td:nth-child(3),
      th:nth-child(3) {
        width: 20%;
      }

      td:nth-child(4),
      th:nth-child(4) {
        width: 15%;
      }

      td:nth-child(5),
      th:nth-child(5) {
        width: 20%;
      }

      td:nth-child(6),
      th:nth-child(6) {
        width: 22%;
      }
    }

    .sticky {
      td {
        position: sticky;
        z-index: 2;
        top: 48px;
      }
    }

    .filter-wrapper {
      background-color: #bdbdbd;

      .filter {
        color: #1d1d26;
        font-size: 13px;
        line-height: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        padding-left: 12px;

        .group-chip {
          display: flex;
          flex-wrap: nowrap;
          overflow: auto;
          margin: 0 4px;

          &::-webkit-scrollbar {
            display: none;
          }

          ::v-deep .g-chip {
            overflow: visible;
          }

          .chip-title {
            color: #97A3B4;
            font-weight: 400;
            font-size: 11px;
          }

          .chip-content {
            color: #1D1D26;
            font-weight: 700;
            font-size: 12px;
          }
        }

        .btn-add-filter {
          border-radius: 4px;
          background-color: #2979ff;
          color: white;
          padding: 10px;
          cursor: pointer;
          font-size: 14px;
        }
      }
    }
  }
</style>
