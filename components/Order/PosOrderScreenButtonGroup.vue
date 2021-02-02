<template>
  <div class="buttons" area="buttons">
    <div class="btn"
           v-for="(btn, i) in listBtn" :key="i"
           :style="{
              gridRow: btn.rows[0] + '/' + btn.rows[1],
              gridColumn: btn.cols[0] + '/' + btn.cols[1],
              backgroundColor: btn.backgroundColor,
              color: btn.backgroundColor !== '#FFFFFF' ? btn.textColor : '#000d',
              border: btn.backgroundColor && btn.backgroundColor !== '#FFFFFF' ? null : '1px solid #979797',
              pointerEvents: !isActiveBtn(btn) ? 'none' : 'auto', //disabled
              opacity: !isActiveBtn(btn) ? '0.4' : '1', //disabled
              cursor: !isActiveBtn(btn) ? 'none' : 'pointer'
            }"
           @click="onClick(btn)">
      {{btn.text}}
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosOrderScreenButtonGroup',
    injectService: [
      'OrderStore:(chooseFunction,activeTableProduct,currentOrder)', 'SettingsStore:getPosSetting'
    ],
    data() {
      return {
        listBtn: []
      }
    },
    methods: {
      async generateTemplate() {
        const setting = await this.getPosSetting();
        this.listBtn = [];
        const rightFunctionButtons = setting.rightFunctionButtons;
        const containedBtns = rightFunctionButtons.reduce((acc, btn) => ([...acc, ...btn.containedButtons]), []);
        for (const btn of rightFunctionButtons) {
          if (!containedBtns.includes(btn._id)) {
            this.listBtn.push(
              btn.buttonFunction === 'buybackProduct'
                ? Object.assign({}, btn, {
                  buttonFunctionValue: btn.buyback
                })
                : btn);
          }
        }
      },
      isActiveBtn(btn) {
        return this.$getService('OrderStore:isActiveFnBtn')(btn)
      },
      onClick(btn) {
        if (!btn || !btn.buttonFunction) return
        this.$getService('OrderStore:chooseFunction')(btn.buttonFunction)(btn.buttonFunctionValue)
      }
    },
    async activated() {
      await this.generateTemplate();
    },
    async mounted() {
      await this.generateTemplate();
    },
  }
</script>

<style scoped lang="scss">
  .btn {
    white-space: normal;
    padding: 0 !important;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 14px;
  }

  .buttons {
    padding: 8px 8px 8px 0;
  }
</style>
