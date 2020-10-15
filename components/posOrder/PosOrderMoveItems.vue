<template>
  <div>
    <g-dialog v-model="internalValue" :transition="false" content-class="move-items-dialog">
      <div class="row-flex justify-end w-100">
        <div class="splitter" :style="isMobile ? {height: 'calc(100% - 20px)'} : {height: 'calc(100% - 84px)'}">
          <div class="splitter__header row-flex align-items-center">
            <div v-if="itemsToMove.length">
              <span class="mr-2" style="font-weight: 700; font-size: 15px">Items:</span>
              <span style="font-weight: 600; font-size: 18px; color: #ff4452">{{itemsToMove.length}}</span>
            </div>
            <g-spacer/>
            <g-btn-bs :uppercase="false"
                      :disabled="!itemsToMove.length"
                      icon="icon-move-items"
                      background-color="#1271ff"
                      @click.stop="moveItems">
              <span>Move Items</span>
            </g-btn-bs>
          </div>
          <div class="splitter__content">
            <div v-for="item in itemsToMove" :key="item._id.toString()" class="item">
              <div class="item-detail" @click.stop="returnItem(item)">
                <div>
                  <p :style="[item.printed && { opacity: 0.55 }]" class="item-detail__name">{{item.id}}. {{item.name}}</p>
                  <p>
                    <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">
                      {{$t('common.currency', storeLocale)}} {{item.originalPrice | convertMoney}}
                    </span>
                    <span class="item-detail__price--new" v-if="isItemDiscounted(item)">
                      {{$t('common.currency', storeLocale)}} {{item.price | convertMoney }}
                    </span>
                    <span :class="['item-detail__option', 'text-red-accent-2']">
                      {{getItemSubtext(item)}}
                    </span>
                  </p>
                </div>
                <div class="mr-2 fw-700 row-flex align-items-center" style="font-size: 18px">{{item.quantity}}</div>
              </div>
              <div v-if="item.modifiers">
                <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                        label small text-color="#616161">
                  {{modifier.name}} | {{$t('common.currency', storeLocale)}}{{modifier.price | convertMoney}}
                </g-chip>
              </div>
            </div>
          </div>
        </div>

        <g-icon class="mr-4 ml-4" size="40" color="#fff" style="height: calc(100% - 64px)">keyboard_backspace</g-icon>

        <div class="order-detail" :style="isMobile ? {height: '100%'} : { height: 'calc(100% - 64px)' } ">
          <div class="order-detail__header row-flex align-items-center">
            <div class="row-flex align-items-center">
              <g-avatar size="36"><img alt :src="avatar"></g-avatar>
              <div class="ml-1 fw-700" style="font-size: 13px">
                <div>{{username}}</div>
                <div>
                  <span style="font-weight: 600; font-size: 11px; color: #9e9e9e">Table</span>
                  <span class="ml-2" style="font-weight: 600; font-size: 13px">{{currentOrder.table}}</span>
                </div>
              </div>
            </div>
            <g-spacer v-if="isMobile"/>
            <g-btn-bs v-if="isMobile" class="elevation-1 btn-back" @click="back">
              <g-icon>icon-back</g-icon>
            </g-btn-bs>
            <g-spacer/>
          </div>
          <div class="order-detail__content">
            <div v-for="(item, i) in itemsWithQty" :key="i" class="item"
                 @click.stop="addToMoveItems(item)">
              <div class="item-detail">
                <div>
                  <p class="item-detail__name" :style="[item.printed && { opacity: 0.55 }]">{{item.id}}. {{item.name}}</p>
                  <p>
                    <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">
                      €{{item.originalPrice | convertMoney}}
                    </span>
                    <span class="item-detail__price--new" v-if="isItemDiscounted(item)">
                      {{$t('common.currency', storeLocale)}} {{item.price | convertMoney }}
                    </span>
                    <span :class="['item-detail__option', 'text-red-accent-2']">
                      {{getItemSubtext(item)}}
                    </span>
                  </p>
                </div>
                <div class="mr-2 fw-700 row-flex align-items-center" style="font-size: 18px">{{item.quantity}}</div>
              </div>
              <div v-if="item.modifiers">
                <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                        label small text-color="#616161" close @close="removeModifier(item, index)">
                  {{modifier.name}} | {{$t('common.currency', storeLocale)}}{{modifier.price | convertMoney}}
                </g-chip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </g-dialog>

    <choose-table-dialog :table="currentTable" v-model="showChooseTableDialog" @submit="submitTable" />
  </div>
</template>

<script>
  import ChooseTableDialog from './ChooseTableDialog';
  export default {
    name: 'PosOrderMoveItems',
    components: { ChooseTableDialog },
    props: {
      value: Boolean,
      currentOrder: null,
      user: null,
      storeLocale: String,
      isMobile: Boolean
    },
    filters: {
      convertMoney(value) {
        return !isNaN(value) && value > 0 ? value.toFixed(2) : value
      }
    },
    data() {
      return {
        remainingItems: [],
        itemsToMove: [],
        showChooseTableDialog: false,
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      currentTable() {
        if (this.currentOrder) return this.currentOrder.table
        return ''
      },
      username() {
        return this.user ? this.user.name : ''
      },
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      itemsWithQty() {
        if (this.remainingItems) return this.remainingItems.filter(i => i.quantity > 0)
        return []
      },
    },
    methods: {
      isItemDiscounted(item) {
        return item.originalPrice > item.price
      },
      getItemSubtext({ course, takeout, separate }) {
        if (separate) return
        if (takeout) return 'Take-away'
        if (course && course > 1) return `Course: ${course}`
      },
      back() {
        this.internalValue = false
      },
      addToMoveItems(item) {
        if (item.quantity > 1) {
          const existingItem = this.itemsToMove.find(i => i._id === item._id)
          if (existingItem) {
            existingItem.quantity++
          } else {
            this.itemsToMove.push({ ...item, quantity: 1 })
          }
          item.quantity--
          return
        }
        const existingItem = this.itemsToMove.find(i => i._id === item._id)
        if (existingItem) {
          existingItem.quantity++
        } else {
          this.itemsToMove.push({ ...item, quantity: 1 })
        }
        this.remainingItems.splice(this.remainingItems.indexOf(item), 1)
      },
      returnItem(item) {
        if (item.quantity > 1) {
          const existingItem = this.remainingItems.find(i => i._id === item._id)
          if (existingItem) {
            existingItem.quantity++
          } else {
            this.remainingItems.push({ ...item, quantity: 1 })
          }
          item.quantity--
          return
        }
        const existingItem = this.remainingItems.find(i => i._id === item._id)
        if (existingItem) {
          existingItem.quantity++
        } else {
          this.remainingItems.push({ ...item, quantity: 1 })
        }
        this.itemsToMove.splice(this.itemsToMove.indexOf(item), 1)
      },
      moveItems() {
        this.showChooseTableDialog = true
      },
      submitTable(val) {
        if (val) {
          this.$emit('moveItems', val, this.itemsToMove, this.remainingItems, () => {
            // cleanup
            this.$router.go(-1)
            this.itemsToMove = []
            this.showChooseTableDialog = false
            this.internalValue = false
          })
        }
      }
    },
    watch: {
      'currentOrder.items'(val) {
        if (val) this.remainingItems = _.cloneDeep(val)
      },
      value(val) {
        this.itemsToMove = []
        if (val) {
          this.remainingItems = _.cloneDeep(this.currentOrder.items)
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .splitter {
    background: #fff;
    flex-basis: 30%;
    padding-top: 8px;
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    margin: 10px 0;

    &__header {
      padding: 0 8px;
      position: relative;

      .g-btn-bs {
        margin: 0;
      }
    }

    &__content {
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      overflow: scroll;
      flex-grow: 1;
      margin: 8px;
      position: relative;
    }

    &__actions {
      display: flex;
      flex-direction: row;
      align-items: center;

      &-btn {
        font-size: 16px;
        font-weight: 700;
      }
    }
  }

  .order-detail {
    background: #fff;
    flex-basis: 30%;
    padding: 0 8px;
    position: relative;

    &__header {
      padding: 8px 0;
      display: flex;
      align-items: center;

      .btn-back {
        width: 37px;
        height: 37px;
        border-radius: 50%;
        margin: 0;

        & > .g-icon {
          min-width: 24px;
        }
      }
    }

    &__content {
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      overflow: scroll;
      margin-bottom: 3px;
    }
  }

  .item {
    padding: 8px;

    &:nth-child(even) {
      background-color: #f8f8f8;
    }

    &-detail {
      display: flex;
      justify-content: space-between;
      cursor: pointer;

      &__name {
        font-weight: 700;
        font-size: 14px;
      }

      &__price {
        font-size: 12px;
        color: #616161;
        margin-right: 4px;

        &--new {
          font-size: 14px;
          color: #ff5252;
          margin-right: 4px;
        }
      }

      &__discount {
        text-decoration: line-through;
      }

      &__option {
        font-size: 12px;
        font-style: italic;
        font-weight: 700;
      }
    }
  }
</style>

<style lang="scss">
  .move-items-dialog {
    height: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .splitter__actions-menu {
    display: flex;
    flex-direction: column;
    transform: translateX(25%);

    .g-btn-bs {
      margin: 0;
      font-weight: 700;
      font-size: 16px;
    }
  }

  .choose-table-dialog {
  }
</style>
