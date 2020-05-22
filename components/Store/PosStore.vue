<template>
  <fragment/>
</template>

<script>
  import customParseFormat from 'dayjs/plugin/customParseFormat'
  import { getProvided } from '../logic/commonUtils';
  dayjs.extend(customParseFormat)

  export default {
    name: 'PosStore',
    domain: 'PosStore',
    data() {
      return {
        systemDate: new Date(),
        locale: 'en'
      }
    },
    computed: {
      timeFormat() {
        return $t('dates.timeFormat')
      },
      dateFormat() {
        return $t('dates.dateFormat')
      },
    },
    methods: {
      async login(username, password, errCb) {
        cms.login(username, password, '/management').catch(err => errCb && errCb(err.response.data.message))
      },
      logout() {
        cms.logout()
        document.cookie = ''
        this.$router.push('/sign-in')
      }
    },
    async created() {
      this.setDateInterval = setInterval(() => this.systemDate = new Date(), 10000)
    },
    beforeDestroy() {
      this.setDateInterval && clearInterval(this.setDateInterval)
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.methods, this),
      }
    }
  }
</script>
