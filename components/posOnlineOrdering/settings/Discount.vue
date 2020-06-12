<template>
  <div class="discount">
    <div class="discount__title">Discount</div>
    <div :class="['discount__action-bar', isInDevice && 'discount__action-bar--mobile']">
      <g-btn-bs background-color="indigo accent-2" text-color="white" icon="add@20" @click="openDialogDiscount()">Add New Discount</g-btn-bs>
    </div>
    <div :class="['discount__table', isInDevice && 'discount__table--mobile']">
      <div class="discount__table-header">
        <div class="w-20 pl-2">Name</div>
        <div class="col-2 pl-1">Type</div>
        <div class="col-2 pl-1">Amount</div>
        <div class="flex-equal pl-1">Condition</div>
        <div class="col-1 pl-1 ta-center">Status</div>
        <div class="col-1"></div>
      </div>
      <div class="discount__table-content">
        <template v-if="!listDiscount || !listDiscount.length">
          <div class="discount__table-content--empty">
            <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
            <p class="text-grey-darken-1 mt-2">No discounts created</p>
            <g-btn-bs text-color="indigo accent-2" icon="add@16" class="fw-700" @click="openDialogDiscount()">Add New Discount</g-btn-bs>
          </div>
        </template>
        <template v-else>
          <div v-for="(discount, i) in listDiscount" :key="i"
               :class="['discount__table-row', i % 2 === 0 ? 'discount__table-row--even' : 'discount__table-row--odd']">
            <div class="w-20 pl-2">{{discount.name}}</div>
            <div class="col-2 pl-1" style="text-transform: capitalize">{{getType(discount.type)}}</div>
            <div class="col-2 pl-1">{{getAmount(discount.amount)}}</div>
            <div class="flex-equal pl-1">
              <div v-for="(value, key, index) in getCondition(discount.conditions)" :key=index>
                <span style="font-weight: bold">{{key}}:</span> <span>{{value}}</span>
              </div>
            </div>
            <div class="col-1 pl-1 ta-center">
              <span :class="getStatusClass(discount.enabled)">{{getActiveStatus(discount.enabled)}}</span>
            </div>
            <div class="col-1 row-flex justify-center">
              <g-menu v-model="discount.menu" :close-on-content-click="true" nudge-left="40" nudge-bottom="10">
                <template v-slot:activator="{on}">
                  <g-icon :class="[discount.menu && 'menu--active']" @click="on.click">more_horiz</g-icon>
                </template>
                <div class="menu-action">
                  <div class="menu-action__option" @click="openDialogDiscount(true, discount)">Edit</div>
                  <div class="menu-action__option" @click="changeStatus(discount)">{{discount.enabled ? 'Disable' : 'Enable'}}</div>
                  <div class="menu-action__option" @click="openDialogDelete(discount)">Delete</div>
                </div>
              </g-menu>
            </div>
          </div>
        </template>
      </div>
    </div>
    <dialog-new-discount v-model="dialog.discount" :edit="dialog.edit" :discount="selectedDiscount"
                         @submit="addDiscount" :store-country-locale="storeCountryLocale"/>
    <dialog-delete-item v-model="dialog.delete" type="discount" @confirm="deleteDiscount"/>
  </div>
</template>

<script>
  import DialogNewDiscount from './dialogNewDiscount';
  import DialogDeleteItem from './dialogDeleteItem';

  export default {
    name: "Discount",
    components: {DialogDeleteItem, DialogNewDiscount},
    props: {
      listDiscount: Array,
      storeCountryLocale: String,
    },
    data() {
      return {
        dialog: {
          discount: false,
          edit: false,
          delete: false
        },
        selectedDiscount: null,
      }
    },
    computed: {
      isInDevice() {
        return this.$route.query.device
      }
    },
    methods: {
      openDialogDiscount(edit = false, discount = null) {
        this.dialog.edit = edit
        this.selectedDiscount = discount
        this.dialog.discount = true
      },
      getType(type) {
        if (type && type instanceof Array && type.length > 0) {
          return _.sortBy(type).join('; ')
        }
        return ''
      },
      getAmount({ type, value }) {
        if (type === 'freeShipping') {
          return 'Free Shipping'
        } else if (type === 'percent') {
          return `${value}%`
        } else {
          return `${this.$t('common.currency', this.storeCountryLocale)}${value}`
        }
      },
      getCondition(condition) {
        let conditions = {}
        for (const key in condition) {
          if (key === 'total') {
            let text = ''
            if (condition[key].min) text += `Min ${condition[key].min}`
            if (condition[key].min && condition[key].max) text += ', '
            if (condition[key].max) text += `Max ${condition[key].max}`

            Object.assign(conditions, { [`Total Value`]: text })
          }
          if (key === 'timePeriod') {
            Object.assign(conditions, {
              [`Time Period`]: `${dayjs(condition[key].startDate).format('DD.MM.YYYY')} - ${dayjs(condition[key].endDate).format('DD.MM.YYYY')}`,
            })
          }
          if (key === 'daysOfWeek' && condition[key].length) {
            Object.assign(conditions, {
              [`Days of week`]: `${condition[key].join(', ')}`
            })
          }
          if (key === 'zipCode' && condition[key].length) {
            Object.assign(conditions, {
              [`Zip codes`]: `${condition[key].join(', ')}`
            })
          }
          if (key === 'coupon') {
            Object.assign(conditions, {
              [`Coupon`]: `${condition[key]}`
            })
          }
        }
        return conditions
      },
      getStatusClass(status) {
        if (status) {
          return 'status status--active'
        } else {
          return 'status status--disabled'
        }
      },
      getActiveStatus(enabled) {
        return enabled ? 'Active' : 'Inactive'
      },
      changeStatus(discount) {
        this.$emit('updateDiscount',
          Object.assign({}, discount, { enabled: !discount.enabled }),
          () => {this.$emit('getDiscounts')})
      },
      openDialogDelete(discount) {
        this.selectedDiscount = discount
        this.dialog.delete = true
      },
      addDiscount(discount) {
        this.$emit('addDiscount', discount, () => {
          this.$emit('getDiscounts')
        })
      },
      deleteDiscount() {
        this.$emit('removeDiscount', this.selectedDiscount, () => {
          this.$emit('getDiscounts')
        })
      }
    },
    created() {
      this.$emit('getDiscounts')
    }
  }
</script>

<style scoped lang="scss">
  .discount {
    height: 100%;
    width: 100%;
    overflow: hidden;

    &__title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 16px;
      margin-left: 5px;
    }

    &__action-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 16px;
      margin-right: -8px;

      &--mobile {
        margin-top: -40px
      }
    }

    &__table {
      background: #FFFFFF;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;
      overflow: hidden;
      height: calc(100% - 120px);

      &--mobile {
        height: calc(100% - 55px);
      }

      &-header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;

        & > div {
          cursor: pointer;
        }
      }

      &-content {
        height: calc(100% - 38px);
        overflow: hidden auto;
        scrollbar-width: none; // firefox

        &::-webkit-scrollbar {
          display: none;
        }

        &--empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-items: center;
          margin-top: 64px;

          .g-btn-bs ::v-deep > * {
            font-weight: 700;
          }
        }
      }

      &-row {
        display: flex;
        align-items: center;
        min-height: 55px;
        font-size: 14px;
        color: #424242;

        &--odd {
          background: #FAFAFC;
        }

        &--even {
          background: #FFFFFF;
        }

        .status {
          border-radius: 16px;
          line-height: 2;
          text-transform: capitalize;

          &--disabled {
            background: #FFF3E0;
            color: #FF9800;
            padding: 6px 12px;
          }

          &--active {
            background: #DFF2DF;
            color: #4CAF50;
            padding: 6px 16px;
          }
        }
      }
    }
  }

  .menu {
    &--active {
      border-radius: 50%;
      background: #F4F5FA;
      color: #536DFE !important;
    }

    &-action {
      background: white;
      border-radius: 2px;

      &__option {
        color: #201F2B;
        padding: 8px 36px 8px 12px;
        white-space: nowrap;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          background-color: #EFEFEF;
        }
      }
    }
  }
</style>
