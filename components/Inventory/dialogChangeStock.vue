<template>
  <g-dialog v-model="internalValue">
    <div class="dialog">
      <div class="dialog-title">{{$t('inventory.useRemoveStock')}}</div>
      <g-icon size="16" class="dialog-icon--close" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-content">
        <p><b>{{$t('inventory.item')}}: </b> {{name}}</p>
        <p><b>{{$t('inventory.currentStock')}}: </b> {{stock | formatNumber}}</p>
        <p><b>{{$t('inventory.newStock')}}: </b> <span :style="{...mode === 'add' && {color: '#1271FF'}, ...mode === 'remove' && {color: '#FF4452'}}">{{newStock | formatNumber}}</span></p>
        <div class="dialog-content__action">
          <div :class="['btn', mode === 'add' && 'btn--blue']" @click="mode = 'add'">
            <g-icon color="white" >add</g-icon>
          </div>
          <div :class="['btn', mode === 'remove' && 'btn--red']" @click="mode = 'remove'">
            <g-icon color="white">remove</g-icon>
          </div>
          <g-text-field-bs ref="textfield" :rules="rules" :value="change" @input="changeValue"/>
        </div>
        <g-select v-if="mode === 'remove'" class="dialog-content__reason" text-field-component="GTextFieldBs" :items="reasons" v-model="reason" placeholder="Reason (Optional)"/>
        <div v-else class="dialog-content__reason" style="height: 38px"></div>
      </div>
      <div class="dialog-keyboard">
        <pos-keyboard-full width="100%" type="numeric" @enter-pressed="submit"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogChangeStock",
    props: {
      value: Boolean,
      name: String,
      stock: Number
    },
    filters: {
      formatNumber(number) {
        return number && number.toFixed(2)
      }
    },
    data() {
      return {
        change: 0,
        mode: '',
        reason: '',
        reasons: [$t('inventory.expiredIngredient'), $t('inventory.updateToMatch')]
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          if(!val) {
            this.mode = ''
            this.change = 0
            this.reason = ''
          }
          this.$emit('input', val)
        }
      },
      newStock() {
        if(this.mode === 'add')
          return this.stock + this.change
        else if (this.mode === 'remove')
          return (this.stock - this.change) > 0 ? (this.stock - this.change) : 0
        else
          return this.stock
      },
      rules() {
        let rules = []
        if(this.mode === 'remove') {
          const stock = this.stock
          rules.push(val => +val <= stock || '')
        }
        return rules
      }
    },
    watch: {
      internalValue(val) {
        if(val) {
          if(this.$refs && this.$refs.textfield) {
            this.$refs.textfield.$refs.input.click()
          } else {
            setTimeout(() => {
              this.$refs.textfield.$refs.input.click()
            }, 200)
          }
        }
      }
    },
    methods: {
      changeValue(val) {
        this.change = +val
      },
      submit() {
        if(this.mode === 'remove' && this.stock < this.change) return
        this.$emit('submit', {
          type: this.mode,
          change: this.change,
          value: this.newStock,
          reason: this.reason
        })
        this.internalValue = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    width: 500px;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
    padding: 16px;
    position: relative;
    overflow: auto;
    border-radius: 2px;

    &-title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px;
    }

    &-content {
      p {
        font-size: 16px;
        line-height: 20px;
        margin: 8px 0;
      }

      .btn {
        flex: 0 0 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #9e9e9e;
        border-radius: 4px;
        margin-right: 8px;

        &--blue {
          background-color: #1271FF;
        }

        &--red {
          background-color: #ff4552;
        }
      }

      .bs-tf-wrapper,
      .g-select ::v-deep .bs-tf-wrapper {
        margin: 0;
        width: 100%;

        ::v-deep input {
          outline: none;
        }
      }

      &__action {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      &__reason {
        margin-bottom: 8px;
      }
    }

    &-keyboard {
      background: #bdbdbd;
      padding: 4px;
      border-radius: 2px;
    }
  }

  @media screen and (max-height: 599px) {
    .dialog {
      width: 400px;
      padding: 12px;

      &-title {
        font-size: 18px;
        line-height: 22px;
      }

      &-content {

        p {
          font-size: 14px;
          line-height: 18px;
          margin: 4px 0;
        }

        &__action {
          margin-bottom: 4px;
        }

        &__reason {
          margin-bottom: 4px;
        }
      }

      &-keyboard {
        ::v-deep .key {
          font-size: 16px !important;
        }
      }
    }
  }
</style>
