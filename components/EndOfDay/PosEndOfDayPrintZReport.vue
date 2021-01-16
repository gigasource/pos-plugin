<template>
  <div>
    <slot :close="close" :open="open" name="activator"></slot>
    <g-dialog eager v-model="dialog" width="45%" overlay-color="#6B6F82" overlay-opacity="0.95">
      <div class="print-confirm-dialog">
        <p class="title">{{$t('ui.confirmation')}}</p>
        <p class="confirmation-content">{{$t('report.confirmationPrintZ1')}} <br/> {{$t('report.confirmationPrintZ2')}}?</p>
        <div class="confirmation-buttons">
          <g-btn @click="close()" :uppercase="false" background-color="#fff" class="mr-2" flat style="border: 1px solid #979797" text-color="#1D1D26" width="120px">
            {{$t('ui.cancel')}}
          </g-btn>
          <g-btn @click="close(true)" :uppercase="false" background-color="#E57373" class="mr-2" flat text-color="#FFFFFF" width="120px">
            {{$t('ui.ok')}}
          </g-btn>
        </div>
      </div>
    </g-dialog>

  </div>
</template>

<script>
  import { getInternalValue } from 'pos-vue-framework';

  export default {
    name: 'PosEndOfDayPrintZReport',
    props: {
      modelValue: null
    },
    methods: {
      open() {
        this.dialog = true;
      },
      close(confirmed = false) {
        this.dialog = false
        if (confirmed) this.$emit('confirmed')
      }
    },
    setup(props, context) {
      const dialog = getInternalValue(props, context);
      return { dialog };
    },
  }
</script>

<style lang="scss" scoped>
  .title {
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 25px;
    color: #1D1D26;
  }

  .confirmation-content {
    margin-top: 26px;
    margin-bottom: 50px;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 18px;
    color: #1D1D26;

  }

  .confirmation-buttons {
    display: flex;
    justify-content: flex-end;
  }

  .print-confirm-dialog {
    padding: 40px 8px 10px 8px;
    width: 100%;
    text-align: center;
    background-color: #fff;
  }
</style>
