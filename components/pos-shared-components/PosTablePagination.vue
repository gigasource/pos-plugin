<template>
  <div class="g-pagination-wrapper">
    <div v-if="selected" class="g-pagination-text">Selected: {{selected}}</div>
    <div class="g-pagination-text">{{$t('ui.tblTotal')}}: {{totalDocument}}</div>
    <div class="g-pagination-text">{{$t('ui.tblRow')}}:</div>
    <div class="g-pagination-input">
      <g-select :items="computedRowsPerPageItems"
                :value="selectLimit"
                @input="changeLimitRow($event)"
      />
    </div>
    <div class="g-pagination-text">
      {{$t('ui.tblPage')}}:
    </div>
    <div class="g-pagination-input">
      <g-combobox
          v-model="comboPage"
          :items="listPageNumber"
          @input="gotoPage($event)"
          style="font-size: 13px;"
      ></g-combobox>
    </div>
    <g-btn :uppercase="false" flat :disabled="disablePre" @click="gotoFirstPage">
      <g-icon>first_page</g-icon>
    </g-btn>
    <g-btn :uppercase="false" flat :disabled="disablePre" @click="prevPage">
      <g-icon>chevron_left</g-icon>
    </g-btn>
    <g-btn :uppercase="false" flat :disabled="disableNext" @click="nextPage">
      <g-icon>chevron_right</g-icon>
    </g-btn>
    <g-btn :uppercase="false" flat :disabled="disableNext" @click="gotoLastPage">
      <g-icon>last_page</g-icon>
    </g-btn>
  </div>
</template>

<script>
  import _ from 'lodash';

  export default {
    name: 'PosTablePagination',
    props: {
      limit: Number,
      totalDocument: Number,
      currentPage: Number,
      selected: Number,
    },
    data: () => ({
      computedRowsPerPageItems: [10, 15, 20, 25, 50]
    }),
    methods: {
      nextPage() {
        let page = this.currentPage + 1;
        this.$emit('update:currentPage', page);
        this.$emit('execQueryByPage');
      },
      prevPage() {
        let page = this.currentPage - 1;
        this.$emit('update:currentPage', page);
        this.$emit('execQueryByPage');
      },
      changeLimitRow(number) {
        this.$emit('update:limit', number);
        this.$nextTick(() => {
          if (this.currentPage > this.totalPage) {
            this.$emit('update:currentPage', this.totalPage);
          }
          this.$emit('execQueryByPage');
        });
      },
      gotoPage(v) {
        let value = parseInt(v);
        if (!isNaN(value) && value <= this.totalPage) {
          this.$emit('execQueryByPage');
        }
      },
      gotoFirstPage() {
        this.$emit('update:currentPage', 1);
        this.$emit('execQueryByPage');
      },
      gotoLastPage() {
        this.$emit('update:currentPage', this.totalPage);
        this.$emit('execQueryByPage');
      }
    },
    computed: {
      disablePre() {
        return this.currentPage === 1;
      },
      disableNext() {
        return (this.currentPage === this.totalPage) || (this.totalDocument === 0);
      },
      totalPage() {
        return Math.ceil(this.totalDocument / this.limit);
      },
      listPageNumber() {
        let i = 0;
        let list = [];
        while (i < this.totalPage) {
          i++;
          list.push(i);
        }
        return list;
      },
      comboPage: {
        get() {
          return this.currentPage;
        },
        set(v) {
          let value = parseInt(v);
          if (!isNaN(value) && value <= this.totalPage) {
            this.$emit('update:currentPage', value);
          }
        }
      },
      selectLimit: {
        get() {
          return this.limit;
        },
        set(v) {
          let value = parseInt(v);
          if (!isNaN(value)) {
            this.$emit('update:limit', value);
          }
        }
      },
    }
  };
</script>

<style scoped lang="scss">
  .g-pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background-color: #e0e0e0;
    font-size: 13px;
    font-weight: 400;

    .g-pagination-input {
      width: 56px;
      border: 1px solid #979797;
      border-radius: 2px;
      padding: 0 4px;
      background: #fff;

      ::v-deep .g-tf-wrapper::before ,
      ::v-deep .g-tf-wrapper::after {
        display: none;
      }

      ::v-deep .g-tf-wrapper {
        height: 30px;
        margin: 4px 0 !important;

        .g-tf-input {
          font-size: 13px;
        }
      }

      ::v-deep .g-select {
        input {
          height: 0;
        }
      }


      & + .g-btn {
        border-top-left-radius: 2px;
        border-bottom-left-radius: 2px;
        margin-left: 16px;
      }
    }

    .g-pagination-text {
      margin-left: 16px;
      margin-right: 8px;
    }

    .g-btn {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      background-color: #fff;
      border-top: 1px solid #979797;
      border-bottom: 1px solid #979797;
      border-left: 1px solid #979797;
      border-radius: 0;
      padding: 0 !important;
      margin: 12px 0;

      &:last-child {
        border-top-right-radius: 2px;
        border-bottom-right-radius: 2px;
        border-right: 1px solid #979797;
        margin-right: 16px;
      }
    }
  }

  @media screen and (max-width: 1023px) {
    .g-pagination-wrapper {
      font-size: 11px;

      .g-pagination-text {
        margin-left: 8px;
        margin-right: 4px;
      }

      .g-pagination-input {
        width: 52px;

        & + .g-btn {
          margin-left: 8px;
        }
      }

      .g-btn {
        width: 40px !important;
        height: 40px !important;
        min-width: 40px !important;
        margin: 6px 0;

        &:last-child {
          margin-right: 8px;
        }
      }
    }
  }
</style>
