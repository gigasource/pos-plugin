<template>
  <div>
    <div area="info__left">
      <g-avatar size="36">
        <g-icon svg>icon-customer_ava</g-icon>
      </g-avatar>
      <p class="pa-1 ml-2" style="line-height: 16px">
        {{$t('payment.selectCustomer')}}
      </p>
      <g-icon small>add_circle</g-icon>
    </div>
    <div area="info__right">
      <g-avatar size="36">
        <img :src="user ? user.avatar : ''"/>
      </g-avatar>
      <div class="pa-1 ta-right" style="line-height: 16px">
        <p class="username">{{user ? user.name : ''}}</p>
        <p class="fs-small-2">{{formattedDate}}</p>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosPaymentScreenInfo',
    injectService: ['PosStore:(user, systemDate, timeFormat, dateFormat)'],
    computed: {
      formattedDate() {
        return dayjs(this.systemDate).format(`${this.timeFormat} ‧ ${this.dateFormat}`)
      },
    },
  }
</script>

<style scoped lang="scss">
  .info__left {
    display: flex;
    padding: 16px 16px 16px 6px;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
  }

  .info__right {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    padding: 0 6px;

    .username {
      word-break: break-all;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 14px;
      font-weight: 700;
    }
  }
</style>
