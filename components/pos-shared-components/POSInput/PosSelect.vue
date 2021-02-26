<script>
  import { GSelect } from 'pos-vue-framework';

  export default {
    name: 'PosSelect',
    mixins: [GSelect],
  }
</script>

<style scoped lang="scss">
  .g-select ::v-deep {
    .g-menu--activator {
      span {
        margin: 3px
      }
    }

    .g-tf-wrapper {
      margin: 32px 4px 12px;
      width: calc(100% - 10px);
      height: 38px;
      border: 1px solid #ced4da;

      .input-slot {
        font-size: 14px;
        margin-left: 14px;
      }
    }

    .g-tf {
      background-color: #F0F0F0;
      border-radius: 2px;
      padding-left: 12px;
    }

    .g-tf::before, .g-tf::after {
      display: none;
    }

    .g-tf-input {
      display: flex;
    }

    .g-tf-input.selections {
      color: #1d1d26 !important;
      font-weight: bold;
      font-size: 14px;
      line-height: 18px;
      align-items: center;
    }

    .input {
      height: 36px;
      display: flex;
      padding: 4px 16px;
    }

    .g-tf-label {
      top: -24px;
      font-size: 13px;
      line-height: 16px;
      color: #1D1D26;
    }

    .g-tf-label__active {
      transform: none;
    }

    .g-tf-append__inner {
      display: flex;
      align-items: center;
      margin: 4px;
      transition: transform 0.4s;

      .g-icon {
        color: #000000 !important;
      }
    }

    .g-list-item {
      padding: 0;
    }

    input {
      flex-shrink: 1;
      flex-grow: 1;
      flex-basis: 0%;
      padding: 0;
      height: 0;
    }

  }

  .g-select__active::v-deep {
    .g-tf-append__inner .g-icon:last-child {
      transform: rotateZ(180deg);
    }
  }
</style>
