<template>
  <div class="online-order-services">
    <div class="row-flex" style="width: 500px;">
      <div class="online-order-services__item">
        <div class="online-order-services__title">Delivery</div>
        <div class="online-order-services__content row-flex align-items-center">
          <g-radio-group v-model="delivery" row>
            <g-radio small color="#536DFE" label="Yes" :value="true" :class="[delivery && 'selected']"/>
            <g-radio small color="#536DFE" label="No" :value="false" :class="[!delivery && 'selected']"/>
          </g-radio-group>
          <!--        <div class="row-flex align-items-center">-->
          <!--          <div>Automatically turn off after</div>-->
          <!--          <g-select text-field-component="GTextFieldBs" :items="timerOptions" v-model="deliveryTimer"/>-->
          <!--        </div>-->
        </div>
      </div>

      <g-spacer/>
      <div class="online-order-services__item">
        <div class="online-order-services__title">Pickup</div>
        <div class="online-order-services__content row-flex align-items-center">
          <g-radio-group v-model="pickup" row>
            <g-radio small color="#536DFE" label="Yes" :value="true" :class="[pickup && 'selected']"/>
            <g-radio small color="#536DFE" label="No" :value="false" :class="[!pickup && 'selected']"/>
          </g-radio-group>
          <!--        <div class="row-flex align-items-center">-->
          <!--          <div>Automatically turn off after</div>-->
          <!--          <g-select text-field-component="GTextFieldBs" :items="timerOptions" v-model="pickupTimer"/>-->
          <!--        </div>-->
        </div>
      </div>
    </div>

    <div class="online-order-services__item">
      <div class="online-order-services__title">Note to Customers</div>
      <div class="online-order-services__content">
        <g-textarea v-model="note" no-resize outlined rows="5" placeholder="Note..." @click="dialog.text = true"/>

        <!--        <div class="row-flex align-items-center">-->
        <!--          <div style="font-weight: bold;">Automatically turn off note after</div>-->
        <!--          <g-select text-field-component="GTextFieldBs" :items="timerOptions" v-model="offTimer"/>-->
        <!--        </div>-->
      </div>
    </div>

    <div class="row-flex" style="width: 500px">
      <g-spacer/>
      <g-btn-bs background-color="#536DFE" style="margin: 0; width: 96px;" text-color="white" @click.stop="save">Save</g-btn-bs>
    </div>

    <dialog-blogtext-input v-model="dialog.text" label="Note" :default-value="note" @submit="changeNote"/>
  </div>
</template>

<script>
  //todo on/off timer (awaiting redesign/conceptualization)

  export default {
    name: 'OnlineOrderServices',
    data() {
      return {
        // timerOptions: [
        //   { text: 'Off', value: 0 },
        //   { text: '1 hour', value: 1 },
        //   { text: '3 hours', value: 3 },
        //   { text: '6 hours', value: 6 },
        //   { text: '12 hours', value: 12 },
        //   { text: '1 day', value: 24 },
        //   { text: '3 days', value: 72 },
        //   { text: '7 days', value: 168 }
        // ],
        // deliveryTimer: 0,
        // pickupTimer: 0,
        // offTimer: 0
        delivery: null,
        pickup: null,
        note: '',
        dialog: {
          text: false
        }
      }
    },
    methods: {
      save() {
        // const newDate = dayjs();
        this.$emit('showInfoSnackbar', 'Saving...')
        this.$emit('updateOnlineDeviceServices', {
          // deliveryOffTime: this.delivery ? newDate.add(this.deliveryTimer, 'hour').toDate() : null,
          // pickupOffTime: this.pickup ? newDate.add(this.pickupTimer, 'hour').toDate() : null,
          // noteOffTime: newDate.add(this.offTimer, 'hour').toDate()
          delivery: this.delivery,
          pickup: this.pickup,
          noteToCustomers: this.note,
        }, ({ error }) => {
          if (error) {
            this.$emit('showErrorSnackbar', error)
            const posSetting = cms.getModel('PosSetting').findOne()
            const { delivery, pickup, noteToCustomers } = posSetting.onlineDevice.services

            this.delivery = delivery
            this.pickup = pickup
            this.note = noteToCustomers || ''
          } else {
            this.$emit('showInfoSnackbar', 'Saved Settings!')
          }
        })
      },
      getServices() {
        this.$emit('getOnlineDeviceServices', ({ services, error }) => {
          if (error) {
            this.$emit('showErrorSnackbar', error)
          }

          const { delivery, pickup, noteToCustomers } = services
          this.delivery = delivery
          this.pickup = pickup
          this.note = noteToCustomers || ''
        })
      },
      changeNote(val) {
        this.note = val
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.getServices()
      })
    },
    activated() {
      this.$nextTick(() => {
        this.getServices()
      })
    }
  }
</script>

<style lang="scss" scoped>
  .online-order-services {
    background-image: url('/plugins/pos-plugin/assets/out.png');
    width: 100%;
    height: 100%;
    padding: 48px 36px;

    &__item {
      margin-bottom: 36px;
    }

    &__title {
      font-weight: bold;
    }

    &__content {
      .radio-group {
        .g-radio-wrapper {
          margin: 8px 50px 8px 0
        }
      }

      .g-select {
        margin-left: 8px;

        ::v-deep .bs-tf-wrapper {
          width: 108px;
          margin: 4px 5px 4px;

          .bs-tf-inner-input-group {
            border-color: #979797;
            border-radius: 1px;
            background: white;
            padding-right: 4px;
          }
        }
      }

      .g-textarea {
        width: 500px;
        margin: 8px 0;

        ::v-deep fieldset {
          border-color: #efefef;
          border-width: 1px;
          background: white;

          textarea {
            padding: 12px 16px;
          }
        }
      }
    }
  }
</style>
