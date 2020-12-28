<template>
  <g-sidebar>
    <template v-slot:header>
      <div class="row-flex align-items-center py-2 px-3">
        <g-avatar size="40">
          <img alt :src="avatar"/>
        </g-avatar>
        <p class="username">{{userName}}</p>
        <p class="time">{{time}}</p>
      </div>
    </template>
    <div class="sidebar-content-wrapper">
      <div class="sidebar-content">
        <div :class="['sidebar-row', item.displayChild && 'sidebar-row--open']" v-for="(item, i) in computedSidebar"
             :key="i">
          <div
              :class="['sidebar-row__content', isSelectedItem(item) && 'sidebar-row--selected', item.displayChild && 'sidebar-row--open']"
              @click="selectMenu(item)">
            <g-icon size="20" class="sidebar-row__icon">{{item.icon}}</g-icon>
            <p class="sidebar-row__title">{{ item.title }}</p>
            <g-icon v-if="item.items" :class="['sidebar-row__arrow', item.displayChild && 'sidebar-row__arrow--open']">
              expand_less
            </g-icon>
          </div>
          <div v-show="item.items && item.displayChild" class="sidebar-row__children">
            <template v-for="(child, i) in item.items">
              <div v-if="child.type && child.type === 'edit'" class="row-flex">
                <div class="sidebar-row__children--edit add" @click="addMenu">
                  + {{$t('ui.add')}}
                </div>
                <div :class="['sidebar-row__children--edit','delete', !selectedPrinterMenu && 'disabled']" @click="deleteMenu">
                  {{$t('ui.delete')}}
                </div>
              </div>
              <div v-else :class="['sidebar-row__children--content', isSelectedItem(child) && 'sidebar-row--selected']"
                   :key="i" @click.stop="selectMenu(child)">
                <g-icon v-if="child.icon" class="sidebar-row__icon sidebar-row__icon--small">{{child.icon}}</g-icon>
                <p class="sidebar-row__title">{{ child.title }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="sidebar-footer">
        <g-btn-bs elevation="2" icon="icon-back" background-color="white" style="display: block" @click="back">{{$t('ui.back')}}
        </g-btn-bs>
      </div>
    </div>
  </g-sidebar>
</template>

<script>
  // TODO: setActive
  export default {
    name: "PosPrinterSettingSidebar",
    props: {
      view: null
    },
    injectService: [
      'PosStore:(systemDate, user)',
      'SettingsStore:(getPrinterGeneralSetting, printerGeneralSetting, createGroupPrinter, deleteGroupPrinter, genPrinterSidebar, printerSidebar, selectedPrinterMenu)',
      'dialogConfirmDeletePrinterCategory:setActive'
    ],
    data() {
      return {
        // PosStore inject
        systemDate: null,
        user: null,
        // SettingsStore inject
        printerGeneralSetting: null,
        printerSidebar: [],
        selectedPrinterMenu: null,
      }
    },
    computed: {
      userName() {
        return this.user ? this.user.name : ''
      },
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      time() {
        return dayjs(this.systemDate).format('HH:mm')
      },
      computedSidebar() {
        const sidebar = this.printerSidebar
        if(sidebar) {
          const category = sidebar.find(s => s.key === 'receiptCategory')
          const kitchens = category ? category.items : []
          for (const kitchen of kitchens) {
            if (this.printerGeneralSetting && this.printerGeneralSetting.useMultiPrinterForKitchenPrinter) {
              kitchen.slot = 'multiple'
            } else {
              kitchen.slot = 'printer'
            }
          }
          const invoice = sidebar.find(s => s.key === 'invoiceReport')
          if(invoice)
            if (this.printerGeneralSetting && this.printerGeneralSetting.useMultiPrinterForInvoicePrinter) {
              invoice.slot = 'multiple'
            } else {
              invoice.slot = 'printer'
            }
          const receipt = sidebar.find(s => s.key === 'entireReceipt')
          if(receipt) {
            if(receipt.items) {
              for(const item of receipt.items) {
                if (this.printerGeneralSetting && this.printerGeneralSetting.useMultiPrinterForEntirePrinter) {
                  item.slot = 'multiple'
                } else {
                  item.slot = 'printer'
                }
              }
            } else {
              if (this.printerGeneralSetting && this.printerGeneralSetting.useMultiPrinterForEntirePrinter) {
                receipt.slot = 'multiple'
              } else {
                receipt.slot = 'printer'
              }
            }
          }
        }
        return sidebar
      }
    },
    methods: {
      isSelectedItem(item) {
        return item === this.selectedPrinterMenu;
      },
      async selectMenu(menu) {
        if (menu.items) {
          menu.displayChild = !menu.displayChild;
        } else {
          this.selectedPrinterMenu = menu;
          this.$emit('update:view', {
            name: menu.slot,
            params: {
              id: menu.id,
              name: menu.title,
              type: menu.type
            }
          })
        }
      },
      async addMenu() {
        const printer = await this.createGroupPrinter()
        this.$emit('update:view', {
          name: this.printerGeneralSetting && this.printerGeneralSetting.useMultiPrinterForKitchenPrinter ? 'multiple' : 'printer',
          params: {
            id: printer._id,
            name: printer.name,
            type: 'kitchen'
          }
        })
        this.selectedPrinterMenu = this.printerSidebar[0].items[0]
      },
      deleteMenu() {
        this.$emit('deleteMenu', true)
      },
      back() {
        this.$router.push({path: '/pos-dashboard'});
      },
      // inject
      getPrinterGeneralSetting() { console.error("SettingsStore:getPrinterGeneralSetting was not injected")},
      createGroupPrinter() {console.error("SettingsStore:createGroupPrinter was not injected") },
      deleteGroupPrinter() {console.error("SettingsStore:deleteGroupPrinter was not injected") },
      genPrinterSidebar() {console.error("SettingsStore:genPrinterSidebar was not injected") },
      setActive() { console.error("dialogConfirmDeletePrinterCategory:setActive was not injected")}
    },
    async created() {
      setTimeout(async () => {
        await this.getPrinterGeneralSetting()
        await this.genPrinterSidebar()

        const settingsStore = this.$getService('SettingsStore')
        settingsStore.$watch('selectedPrinterMenu', async val => {
          await this.selectMenu(val)
        })
      }, 100)
    }
  }
</script>

<style scoped lang="scss">
  .g-sidebar-wrapper {
    -webkit-tap-highlight-color: transparent;

    ::v-deep .g-sidebar-header {
      .username {
        flex: 1;
        font-size: 14px;
        font-weight: 600;
        margin-left: 12px;
      }

      .time {
        font-weight: 600;
      }
    }

    ::v-deep .g-sidebar {
      position: relative;
    }

    .sidebar-content-wrapper {
      flex: 1;
      overflow: hidden;

      .sidebar-content {
        margin-top: 8px;
        height: calc(100% - 64px);
        overflow: auto;

        .sidebar-row {
          color: #424242;
          cursor: pointer;

          &__content {
            display: flex;
            align-items: center;
          }

          &__icon {
            margin: 16px;
          }

          &__title {
            word-break: break-all;
            -webkit-line-clamp: 1;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-size: 14px;
            font-weight: 700;
            flex: 1;
          }

          &__arrow {
            transition: transform 0.3s;

            &--open {
              transform: rotate(180deg);
            }
          }

          &__children {
            &--content {
              display: flex;
              align-items: center;

              .g-icon.sidebar-row__icon--small {
                font-size: 12px !important;
                margin-right: 20px;
                margin-left: 20px;
              }

              .sidebar-row__title {
                font-weight: 600;
              }
            }

            &--edit {
              padding: 8px 16px;
              margin: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              font-size: 14px;
              flex: 1;

              &.add {
                color: #2979FF;
                border: 1px dashed #2196F3;
                background: #E3F2FD;
              }

              &.delete {
                color: #ff4552;
                border: 1px dashed #f32040;
                background: #fcd4dd;

                &.disabled {
                  color: #616161;
                  border-color: #bdbdbd;
                  background: #f0f0f0;
                  pointer-events: none;
                }
              }
            }
          }

          &--selected {
            background: linear-gradient(9.91deg, #3949AB 0%, #4FC3F7 100%) !important;
            box-shadow: 0 4px 13px rgba(94, 129, 244, 0.75);
            border-radius: 0 4px 4px 0;
            color: white;
            margin-right: 8px;
          }

          &--open {
            background-color: #f7f7f7;

            &.sidebar-row__content {
              background-color: #ededed;
            }
          }

          &__arrow {
            margin-left: auto;
            margin-right: 13px;

            &--collapse {
              transition: transform 0.3s;
            }

            &--expand {
              transform: rotate(-180deg);
            }
          }
        }
      }

      .sidebar-footer {
        z-index: 202;
        background: white;
        color: #1d1d26;
        padding: 12px;
      }
    }

  }
</style>
