<template>
  <g-dialog v-model="internalValue" width="50%">
    <g-card :class="['dialog-multi-payment', 'col-flex', 'pa-3', rotate && 'rotate']">
      <div class="row-flex align-items-center">
        <span class="fw-700 mb-2" style="font-size: 20px">Multi Payment</span>
        <g-spacer/>
        <span class="mr-1">Total:</span>
        <span class="fw-700" style="font-size: 18px; color: #1271FF">
          {{$t('common.currency', storeLocale)}} {{total}}
        </span>
      </div>
      <div>
        <template v-for="item in listPayments">
          <div class="mt-1 mb-2 row-flex align-items-center">
            <g-btn-bs background-color="#2979ff" text-color="#fff" border-radius="2px"
                      @click="click(`${item.name}-textfield`)">
              <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
              <span class="ml-2" style="text-transform: capitalize">{{ item.name }}</span>
            </g-btn-bs>
            <pos-textfield-new clearable v-if="item.name === 'card'" ref="card-textfield"
                               v-model="cardEditValue" @click.stop="getRemainingValue"/>
            <pos-textfield-new clearable v-else ref="cash-textfield"
                               v-model="cashEditValue" @click.stop="getRemainingValue"/>
          </div>
        </template>
      </div>
      <div class="mb-3 mt-3">
        <pos-keyboard-full
            style="grid-area: 1 / 1 / 5 / 4"
            :template="keyboardTemplate"
            :items="keyboardItems"/>
      </div>
      <g-btn-bs background-color="#2979ff" text-color="#fff" class="w-100" :disabled="disableConfirmMulti"
                @click.stop="submit">
        Confirm
      </g-btn-bs>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogMultiPayment',
    props: {
      value: Boolean,
      total: [Number, String],
      storeLocale: String,
      cardValue: Number,
      cashValue: Number,
      rotate: Boolean,
    },
    data() {
      return {
        keyboardTemplate: 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
          '"key4 key4 key5 key5 key6 key6" ' +
          '"key1 key1 key2 key2 key3 key3" ' +
          '"keyDot keyDot key0 key0 del del";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardItems: [
          ...Object.values({
            key7: { content: ['7'], style: 'grid-area: key7' },
            key8: { content: ['8'], style: 'grid-area: key8' },
            key9: { content: ['9'], style: 'grid-area: key9' },
            key4: { content: ['4'], style: 'grid-area: key4' },
            key5: { content: ['5'], style: 'grid-area: key5' },
            key6: { content: ['6'], style: 'grid-area: key6' },
            key1: { content: ['1'], style: 'grid-area: key1' },
            key2: { content: ['2'], style: 'grid-area: key2' },
            key3: { content: ['3'], style: 'grid-area: key3' },
            key0: { content: ['0'], style: 'grid-area: key0' },
            keyDot: { content: ['.'], style: 'grid-area: keyDot' },
          }),
          {
            content: [''],
            img: 'delivery/key_delete',
            style: 'grid-area: del; background-color: #e0e0e0',
            action: 'delete'
          },
        ],
        listPayments: [
          { name: 'cash', icon: 'icon-cash' },
          { name: 'card', icon: 'icon-credit_card' },
        ],
        cashEditValue: '',
        cardEditValue: '',
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
      disableConfirmMulti() {
        const number = (+this.cashEditValue) + (+this.cardEditValue);
        return isNaN(+this.cashEditValue) ||
          isNaN(+this.cardEditValue) ||
          number < this.total
      }
    },
    methods: {
      getRemainingValue() {
        if (this.cashEditValue && this.cardEditValue) return 0
        if (+this.cashEditValue > this.total || +this.cardEditValue > this.total) return 0
        if (this.cashEditValue && !isNaN(+this.cashEditValue)) return this.cardEditValue = this.total - (+this.cashEditValue)
        if (this.cardEditValue && !isNaN(+this.cardEditValue)) this.cashEditValue = this.total - (+this.cardEditValue)
      },
      submit() {
        this.$emit('submit', {
          card: +this.cardEditValue,
          cash: +this.cashEditValue,
        })
      },
      click(ref) {
        this.$refs[ref] && this.$refs[ref][0].$el.click()
      }
    },
    watch: {
      value(val) {
        if (val) {
          this.cashEditValue = this.cashValue ? '' + this.cashValue : '';
          this.cardEditValue = this.cardValue ? '' + this.cardValue : '';

          setTimeout(() => {
            this.$nextTick(() => this.click('cash-textfield'))
          }, 1000)
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  ::v-deep .key {
    border: 1px solid #BDBDBD;
    border-radius: 2px;
    font-size: 24px;
    font-weight: 700;
    box-shadow: unset;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .g-btn-bs {
    margin: 0;
    flex-basis: 40%;
    height: 50px;
  }

  .g-tf-wrapper {
    margin-bottom: 0;
    margin-top: 0;
    margin-right: 0;
  }

  .bs-tf-wrapper {
    margin-bottom: 0;
    margin-top: 0;
    margin-right: 0;

    .bs-tf-inner-input-group {
      border-radius: 2px;
    }
  }

  .rotate {
    width: 400px;
    height: 580px !important;
    transform: rotate(-90deg) translateX(-100%);
    transform-origin: left top;
  }
</style>

<style lang="scss">

</style>
