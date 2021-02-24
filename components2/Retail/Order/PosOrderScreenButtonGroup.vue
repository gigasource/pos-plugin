<script>
import { ref, onActivated } from 'vue'
import { genScopeId } from '../../utils';
import { appHooks, posSettings } from '../../AppSharedStates';
import {
  chooseFunction
} from '../pos-retail-shared-logic'

export default {
    name: 'PosOrderScreenButtonGroup',
    props: {
      isRefundMode: Boolean
    },
    setup(props) {
      const { isRefundMode } = props
      const listBtn = ref([])

      const fixedBtnOrder = [
        { "rows": [5, 7], "cols": [1, 1], "backgroundColor": "#7BB872", "textColor": "#FFFFFF", "text": "Quick Cash" },
        { "rows": [5, 5], "cols": [2, 2], "backgroundColor": "#F9A825", "textColor": "#FFFFFF", "text": "Save" },
        { "rows": [6, 6], "cols": [2, 2], "backgroundColor": "#1271FF", "textColor": "#FFFFFF", "text": "Pay" }
      ]

      const fixedBtnRefund = [
        { "rows": [5, 7], "cols": [1, 1], "backgroundColor": "#1271FF", "textColor": "#FFFFFF", "text": "Refund" },
        { "rows": [5, 5], "cols": [2, 2], "backgroundColor": "#F9A825", "textColor": "#FFFFFF", "text": "Save" },
        { "rows": [4, 4], "cols": [1, 3], "backgroundColor": "#FFFFFF", "textColor": "#000000", "text": "Change refund fee" }
      ]

      onActivated(async() => {
        await appHooks.emit('settingChange')
        await generateTemplate();
      })

      async function generateTemplate() {
        if (isRefundMode)
          return listBtn.value = fixedBtnRefund
        const setting = posSettings.value;
        listBtn.value = []
        const rightFunctionButtons = setting.rightFunctionButtons
        if (!rightFunctionButtons) return

        for (const btn of rightFunctionButtons) {
          listBtn.value.push(
            btn.buttonFunction === 'buybackProduct'
                ? Object.assign({}, btn, {
                  buttonFunctionValue: btn.buyback
                })
                : btn
          );
        }

        listBtn.value = [...listBtn.value, ...fixedBtnOrder]
      }

      function isActiveBtn(btn) {
        return true
      }

      function onClick(btn) {
        if (!btn || !btn.buttonFunction) return
        chooseFunction(btn.buttonFunction)(btn.buttonFunctionValue)
      }

      return genScopeId(() => (
          <div class="buttons" area="buttons">
            {listBtn.value.map((btn, i) =>
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
