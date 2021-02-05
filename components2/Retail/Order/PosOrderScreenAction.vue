<script>
import { ref, onActivated, onMounted } from 'vue'
import { genScopeId } from '../../utils';
import { posSettings } from '../../AppSharedStates';

import {
  chooseFunction,
  isActiveFnBtn,
  updateTableRows
} from './temp-logic';

export default {
    name: 'PosOrderScreenAction',
    setup() {
      const listBtn = ref([])
      onActivated(async() => {
        await generateTemplate();
      })
      onMounted(async () => {
        await generateTemplate();
      })

      const actionRef = ref(null)

      async function generateTemplate() {
        const rows = posSettings.value.generalSetting.quickFnRows;

        //define template

        if (actionRef.value) {
          // const tablePercent = 73 - 9 * rows;
          // const actionPercent = 9 * rows;
          // actionRef.value.style['grid-template-rows'] = `repeat(${rows},1fr)`;
          // const leftLayout = actionRef.parentElement;
          // leftLayout.style['grid-template-rows'] = `8% ${tablePercent}% 11% ${actionPercent}% 8%`;
          // actionRef.value.style.display = rows === 0 ? 'none' : 'grid';
        }
        //add btn
        listBtn.value = [];
        const btns = setting.leftFunctionButtons.slice(0, 4 * rows);
        const containedBtns = btns.reduce((acc, btn) => ([...acc, ...btn.containedButtons]), []);

        for (const btn of btns) {
          if (!containedBtns.includes(btn._id)) {
            listBtn.value.push(
                btn.buttonFunction === 'buybackProduct'
                    ? Object.assign({}, btn, {
                      buttonFunctionValue: btn.buyback
                    })
                    : btn);
          }
        }
        if(listBtn.value.length === 4) {
          listBtn.value.unshift(null, null, null, null)
        }
        updateTableRows.value()
      }

      function isActiveBtn(btn) {
        return isActiveFnBtn(btn)
      }

      function onClick(btn) {
        if (!btn || !btn.buttonFunction)
          return
        chooseFunction(btn.buttonFunction)(btn.buttonFunctionValue)
      }

      function getBtnStyle(btn) {
        return btn && {
          // gridRow: btn.rows[0] + '/' + btn.rows[1],
          // gridColumn: btn.cols[0] + '/' + btn.cols[1],
          backgroundColor: btn.backgroundColor,
          color: btn.backgroundColor !== '#FFFFFF' ? btn.textColor : '#000d',
          border: btn.backgroundColor && btn.backgroundColor !== '#FFFFFF' ? null : '1px solid #979797',
          pointerEvents: !isActiveBtn(btn) ? 'none' : 'auto', //disabled
          opacity: !isActiveBtn(btn) ? '0.4' : '1', //disabled
          cursor: !isActiveBtn(btn) ? 'none' : 'pointer'
        }
      }

      return genScopeId(() => (
          <div class="action" ref={actionRef}>
            {listBtn.value.map((btn, i) =>
                <div class="btn" key={i} style={getBtnStyle(btn)} onClick={() => onClick(btn)}>
                  {btn && btn.text}
                </div>
            )}
          </div>
      ))
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
