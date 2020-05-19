<script>
  import { getProvided } from '../logic/commonUtils';

  export default {
    name: 'Snackbar',
    domain: 'Snackbar',
    data() {
      return {
        snackbar: false,
        snackbarColor: 'white',
        snackbarTimeout: 0,
        snackbarContent: null,
      }
    },
    computed: {
      computedSnackbar: {
        get() {
          const { path } = this.$route;
          if (path === '/pos-login' || path === '/pos-setup' || path === '/admin' || path === '/plugins/') {
            return false
          }
          return this.snackbar
        },
        set(val) {
          this.snackbar = val
        }
      }
    },
    methods: {
      showSnackbar(content, color, timeout) {
        this.snackbarColor = color
        this.snackbarContent = content
        this.snackbarTimeout = timeout
        this.computedSnackbar = true
      },
      closeSnackbar() {
        this.computedSnackbar = false
      }
    },
    render(h) {
      const snackbarListener = {
        on: {
          input: e => this.computedSnackbar = e
        }
      }

      return (
        <g-snackbar absolute color={this.snackbarColor} timeout={this.snackbarTimeout} value={this.computedSnackbar} {...snackbarListener}>
          {typeof this.snackbarContent === 'function' ? this.snackbarContent() : this.snackbarContent}
        </g-snackbar>
      )
    },
    provide() {
      return {
        ...getProvided(this.$options.methods, this),
      }
    }
  }
</script>

<style scoped lang="scss">
  ::v-deep .g-snack {
    &-wrapper {
      min-width: 200px;
    }
  }

  .g-snack {
    bottom: 2rem;
    left: calc(220px);
  }
</style>