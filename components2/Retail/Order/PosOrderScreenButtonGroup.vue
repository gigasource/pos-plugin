<template>
  <div class="buttons" area="buttons">
    <div class="btn"
           v-for="(btn, i) in listBtn" :key="i"
           :style="btn && {
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
      {{btn && btn.text}}
    </div>
  </div>
</template>

<script>
import { ref, onActivated, onMounted } from 'vue'
  import { genScopeId } from '../../utils';

  export default {
    name: 'PosOrderScreenButtonGroup',
    injectService: [
      'OrderStore:(chooseFunction,activeTableProduct,currentOrder,isActiveFnBtn,chooseFunction)', 'SettingsStore:getPosSetting'
    ],
    setup() {
      const listBtn = ref([])
      onActivated(async() => {
        await generateTemplate();
      })
      onMounted(async () => {
        await generateTemplate();
      })

      async function generateTemplate() {
        const setting = await getPosSetting();
        listBtn.value = [];
        const rightFunctionButtons = setting.rightFunctionButtons;
        const containedBtns = rightFunctionButtons.reduce((acc, btn) => ([...acc, ...(btn.containedButtons || [])]), []);
        for (const btn of rightFunctionButtons) {
          if (!containedBtns.includes(btn._id)) {
            listBtn.value.push(
                btn.buttonFunction === 'buybackProduct'
                    ? Object.assign({}, btn, {
                      buttonFunctionValue: btn.buyback
                    })
                    : btn);
          }
        }
      }

      function isActiveBtn(btn) {
        return isActiveFnBtn(btn)
      }

      function onClick(btn) {
        if (!btn || !btn.buttonFunction) return
        chooseFunction(btn.buttonFunction)(btn.buttonFunctionValue)
      }

      return genScopeId(() => (
          <div class="buttons" area="buttons">
            {listBtn.map((btn, i) =>
                <div class="btn" key={i} style={btn && {
                  gridRow: btn.rows[0] + '/' + btn.rows[1],
                  gridColumn: btn.cols[0] + '/' + btn.cols[1],
                  backgroundColor: btn.backgroundColor,
                  color: btn.backgroundColor !== '#FFFFFF' ? btn.textColor : '#000d',
                  border: btn.backgroundColor && btn.backgroundColor !== '#FFFFFF' ? null : '1px solid #979797',
                  pointerEvents: !isActiveBtn(btn) ? 'none' : 'auto', //disabled
                  opacity: !isActiveBtn(btn) ? '0.4' : '1', //disabled
                  cursor: !isActiveBtn(btn) ? 'none' : 'pointer'
                }} onClick={() => onClick(btn)}>

                  {btn && btn.text}
                </div>
            )} </div>


      ))
    }
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
    padding: 8px 8px 8px 4px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-gap: 4px;
  }
</style>
