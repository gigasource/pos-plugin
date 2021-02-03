
<script>
  // TODO: Refactor using ColorSelector
  import { activeCategory, articleSelectedColor, setSelectedArticleColor } from '../pos-article-logic';
  import { genScopeId } from '../../utils';
  import { watch } from 'vue'

  export default {
    name: 'PosColorSelector',
    setup() {
      const activeClass = 'color-select-active'
      const buttonColors = ['#FBE4EC', '#B2EBF2', '#C8E6C9', '#DCE775', '#FFF59D', '#FFCC80', '#FFAB91'].map((v, i) => ({ id: i + 1, text: v, value: v}))

      const colorItemStyle = {
        boxShadow: 'none', width: '38px', minWidth: '38px', height: '38px',
      }

      return genScopeId(() => (
          <g-grid-select grid={false} items={buttonColors} v-model={articleSelectedColor.value} style="padding: 5px" v-slots={{
            default: ({ toggleSelect, item, index }) => (
              <g-btn uppercase={false} key={index} ripple={false}
                     style={{ ...colorItemStyle, marginRight: '15px', border: '1px solid #D2D2D2', backgroundColor: item.value }}
                     onClick={() => {
                       toggleSelect(item);
                       setSelectedArticleColor();
                     }} border-radius="50%"></g-btn>
            ),
            selected: ({ toggleSelect, item, index }) => (
              <g-badge badgeSize={12} overlay style="margin-right: 15px;" v-slots={{
                default: () => (
                  <g-btn uppercase={false} className={activeClass}
                         style={{ ...colorItemStyle, border: '2px solid #1271FF', backgroundColor: item.value }}
                         onClick={() => toggleSelect(item)}
                         border-radius="50%">
                    {item.optionTitle}
                  </g-btn>
                ),
                badge: () => <g-icon>done</g-icon>,
              }}>
              </g-badge>
            ),
          }}></g-grid-select>
      ))
    },
  }
</script>

<style lang="scss" scoped>
  ::v-deep .g-badge {
    background-color: #1271FF !important;
    width: 12px;
    min-width: 12px;
    left: 20px;
    top: 5px;

    .g-icon {
      font-size: 10px !important;
      font-weight: bold;
    }
  }

  .color-select-active {
    border: 2px solid #1271FF;
  }
</style>
