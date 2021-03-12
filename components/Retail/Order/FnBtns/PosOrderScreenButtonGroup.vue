<script>
import { onActivated } from 'vue'
import { genScopeId } from '../../../utils';
import { appHooks } from '../../../AppSharedStates';
import { FnBtns, fnBtnSetting, removeBtnFn, showSetBtnFnDialog, renderDialogSetBtn } from './FnBtn'

export default {
  name: 'PosOrderScreenButtonGroup',
  props: {
    inRefundMode: Boolean,
    inEditMode: Boolean
  },
  setup(props) {
    const { isRefundMode } = props

    onActivated(async () => {
      await appHooks.emit('settingChange')
      // await generateTemplate();
    })

    // async function generateTemplate() {
    //   listBtn.value = fnBtnSetting.value
    //   if (isRefundMode)
    //     return listBtn.value = fixedBtnRefund
    //   const setting = posSettings.value;
    //   listBtn.value = []
    //   const rightFunctionButtons = setting.rightFunctionButtons
    //   if (!rightFunctionButtons)
    //     return
    //   for (const btn of rightFunctionButtons) {
    //     listBtn.value.push(
    //       btn.buttonFunction === 'buybackProduct'
    //           ? Object.assign({}, btn, {
    //             buttonFunctionValue: btn.buyback
    //           })
    //           : btn
    //     );
    //   }
    //
    //   listBtn.value = [...listBtn.value]
    // }

    function isActiveBtn(btn) {
      return true
    }

    const columns = 2
    const rows = 6;
    const gridStyle = {
      'grid-template-columns': `repeat(${columns}, 1fr)`,
      'grid-template-rows': `repeat(${rows}, 1fr)`
    }

    function isBtnOverlapAnArea(btn, row, column) {
      return (
             btn.rows[0] <= row && row < btn.rows[1]
          && btn.cols[0] <= column && column < btn.cols[1]
      )
    }

    function renderFnBtnInEditMode() {
      const uniqueBtns = {}
      for (let row = 1; row <= rows; row++) {
        for (let column = 1; column <= columns; column++) {
          let componentKey
          const fnBtn = _.find(fnBtnSetting.value, fnBtn => isBtnOverlapAnArea(fnBtn, row, column))
          if (fnBtn && fnBtn.fn) {
            componentKey = fnBtn.fn
            const compNotAddedYet = !_.has(uniqueBtns, componentKey)
            if (compNotAddedYet) {
              uniqueBtns[componentKey] = <div class="row-flex align-items-center"
                  key={fnBtn.fn} onClick={() => removeBtnFn(fnBtn.fn)}
                  style={{
                    fontSize: '10px',
                    border: '1px solid #979797',
                    backgroundColor: fnBtn.backgroundColor,
                    gridRow: fnBtn.rows[0] + '/' + fnBtn.rows[1],
                    gridColumn: fnBtn.cols[0] + '/' + fnBtn.cols[1],
                  }}> <g-icon small>delete</g-icon> {componentKey}
              </div>
            }
          } else {
            componentKey = `${row}_${column}`
            uniqueBtns[componentKey] = <div class="row-flex justify-center align-items-center"
                key={componentKey}
                onClick={() => showSetBtnFnDialog(row, column)}
                style={{
                  border: '1px solid #979797',
                  gridRow: row + '/' + row,
                  gridColumn: column + '/' + column,
                }}><g-icon>add</g-icon>
            </div>
          }
        }
      }

      return _.values(uniqueBtns)
    }

    function renderBtnInUsageMode() {
      return fnBtnSetting.value.map((btn, i) => {
        const component = FnBtns[btn.fn] || FnBtns['Default']
        const btnInput = { text: btn.text }
        return (
            <component {...{ btnInput }} key={i} style={{
              gridRow: btn.rows[0] + '/' + btn.rows[1],
              gridColumn: btn.cols[0] + '/' + btn.cols[1],
              backgroundColor: btn.backgroundColor,
              color: btn.backgroundColor !== '#FFFFFF' ? btn.textColor : '#000d',
              border: btn.backgroundColor && btn.backgroundColor !== '#FFFFFF' ? null : '1px solid #979797',
              pointerEvents: !isActiveBtn(btn) ? 'none' : 'auto', //disabled
              opacity: !isActiveBtn(btn) ? '0.4' : '1', //disabled
              cursor: !isActiveBtn(btn) ? 'none' : 'pointer'
            }} class="btn"/>
        )
      })
    }

    return genScopeId(() => (
        <div>
          <div class="buttons" style={gridStyle}>
            {props.inEditMode ? renderFnBtnInEditMode() : renderBtnInUsageMode()}
          </div>
          {renderDialogSetBtn()}
        </div>
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
  padding: 4px 4px 4px 2px;
  display: grid;
  grid-gap: 4px;
  height: 100%;
}
</style>
