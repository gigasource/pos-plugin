<template>
  <div class="action" ref="action">
    <div class="btn"
         v-for="(btn, i) in listBtn" :key="i"
         :style="btn && {
              // gridRow: btn.rows[0] + '/' + btn.rows[1],
              // gridColumn: btn.cols[0] + '/' + btn.cols[1],
              backgroundColor: btn.backgroundColor,
              color: btn.backgroundColor !== '#FFFFFF' ? btn.textColor : '#000d',
              border: btn.backgroundColor && btn.backgroundColor !== '#FFFFFF' ? null : '1px solid #979797',
              pointerEvents: !isActiveBtn(btn) ? 'none' : 'auto', //disabled
              opacity: !isActiveBtn(btn) ? '0.4' : '1', //disabled
              cursor: !isActiveBtn(btn) ? 'none' : 'pointer'
            }"
         @click="onClick(btn)">
      {{btn && btn.text}}
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosOrderScreenAction',
    injectService: [
      'OrderStore:(chooseFunction,activeTableProduct)', 'SettingsStore:getPosSetting'
    ],
    data() {
      return {
        listBtn: []
      }
    },
    async activated() {
      await this.generateTemplate();
    },
    async mounted() {
      await this.generateTemplate();
    },
    methods: {
      async generateTemplate() {
        const setting = await this.getPosSetting();
        const rows = setting.generalSetting.quickFnRows;

        //define template
        const actionRef = this.$refs.action;

        if (actionRef) {
          // const tablePercent = 73 - 9 * rows;
          // const actionPercent = 9 * rows;
          // actionRef.style['grid-template-rows'] = `repeat(${rows},1fr)`;
          // const leftLayout = actionRef.parentElement;
          // leftLayout.style['grid-template-rows'] = `8% ${tablePercent}% 11% ${actionPercent}% 8%`;
          // actionRef.style.display = rows === 0 ? 'none' : 'grid';
        }
        //add btn
        this.listBtn = [];
        const btns = setting.leftFunctionButtons.slice(0, 4 * rows);
        const containedBtns = btns.reduce((acc, btn) => ([...acc, ...btn.containedButtons]), []);

        for (const btn of btns) {
          if (!containedBtns.includes(btn._id)) {
            this.listBtn.push(
              btn.buttonFunction === 'buybackProduct'
                ? Object.assign({}, btn, {
                  buttonFunctionValue: btn.buyback
                })
                : btn);
          }
        }
        if(this.listBtn.length === 4) {
          this.listBtn.unshift(null, null, null, null)
        }

        const posStore = this.$getService('OrderStore')
        if (posStore && posStore.updateTableRows && typeof posStore.updateTableRows === 'function') {
          posStore.updateTableRows()
        }
      },
      isActiveBtn(btn) {
        return this.$getService('OrderStore:isActiveFnBtn')(btn)
      },
      onClick(btn) {
        if (!btn || !btn.buttonFunction) return
        this.$getService('OrderStore:chooseFunction')(btn.buttonFunction)(btn.buttonFunctionValue)
      }
    }
  }
</script>

<style scoped lang="scss">
  .action {
    padding: 0 8px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-gap: 4px;
  }

  .btn {
    white-space: normal;
    padding: 0 8px !important;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 14px;
  }
</style>
