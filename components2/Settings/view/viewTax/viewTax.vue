<script>
import { useI18n } from 'vue-i18n';
import { genScopeId, isSameId } from '../../../utils';
import { init, listTaxCategories, onSelectTax, selectedTaxCategory } from './view-tax-logics';
//todo: remove
export default {
  components: {},
  setup() {
    init()
    const { t } = useI18n()
    const headerRender = genScopeId(() => <tr>
      <th>Name</th>
      <th>{t('common.tax')} </th>
      <th>Type</th>
    </tr>)

    const taxItemRender = (tax, idx) => genScopeId(() =>
        <tr key={idx} onClick={() => onSelectTax(tax)} class={[selectedTaxCategory.value && isSameId(selectedTaxCategory.value, tax) && 'bordered']}>
          <td> {tax.name} </td>
          <td> {tax.value}%
          </td>
          <td> {tax.type} </td>
        </tr>)
    return genScopeId(() =>
      <div>
        <g-simple-table striped>
          { headerRender()}
          {listTaxCategories.value.map((tax, i) => taxItemRender(tax, i)()
          )}
        </g-simple-table>
      </div>)
  }
}
</script>

<style scoped lang="scss">
.g-table {
  tr th {
    color: #1d1d26;
    text-align: left;
  }

  th:first-child, td:first-child {
    width: 200px;
  }

  td {
    height: 32px
  }

  .bordered {
    box-shadow: 0 0 4px rgba(18, 113, 255, 0.563019);

    td {
      border-top: 2px solid #1271ff;
      border-bottom: 2px solid #1271ff;
    }

    td:first-child {
      border-left: 2px solid #1271ff;
      padding-left: 14px;
    }

    td:last-child {
      border-right: 2px solid #1271ff;
      padding-right: 14px;
    }
  }
}
</style>
