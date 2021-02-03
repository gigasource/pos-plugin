
<script>
import { KeepAlive} from 'vue'
import viewGeneral from './view/viewGeneral';
import viewCompany from './view/viewCompany';
import viewPayment from './view/viewPayment/viewPayment';
import viewTax from './view/viewTax/viewTax';
import viewUser from './view/viewUser/viewUser';
import viewUserToolbar from './view/viewUser/viewUserToolbar';
import viewTaxToolbar from './view/viewTax/viewTaxToolbar';
import viewPaymentToolbar from './view/viewPayment/viewPaymentToolbar';
import { currentSettingView } from './settings-shared-logics';
import { login } from '../Login/LoginLogic';
import PosSettingsScreenSidebar from './PosSettingsScreenSidebar';
import { genScopeId } from '../utils';
import PosSettingsScreenToolbar from './PosSettingsScreenToolbar';
export default {
  components: { PosSettingsScreenToolbar, viewGeneral, viewUser, viewPayment, viewTax, viewCompany, viewUserToolbar, viewTaxToolbar, viewPaymentToolbar, PosSettingsScreenSidebar},
  setup() {
    //todo: keep-alive
    login('0000')
    const GeneralSetting = <viewGeneral/>
    const UserSetting = <viewUser/>
    const CompanyInfoSetting =<viewCompany/>
    const PaymentSetting = <viewPayment/>
    const TaxSetting = <viewTax/>
    const UserToolbar = <viewUserToolbar></viewUserToolbar>
    const PaymentToolbar = <viewPaymentToolbar></viewPaymentToolbar>
    const TaxToolbar = <viewTaxToolbar></viewTaxToolbar>
    const views = {
      GeneralSetting,
      UserSetting,
      CompanyInfoSetting,
      PaymentSetting,
      TaxSetting
    }

    const toolbars = {
      UserSetting: UserToolbar,
      PaymentSetting: PaymentToolbar,
      TaxSetting: TaxToolbar
    }
    return genScopeId(() =>
      <div class="setting">
        <div class="setting-main">
          <PosSettingsScreenSidebar>
          </PosSettingsScreenSidebar>
          <KeepAlive style="flex:1">
            {views[currentSettingView.value]}
          </KeepAlive>
        </div>
        <PosSettingsScreenToolbar>
          {toolbars[currentSettingView.value]}
        </PosSettingsScreenToolbar>
      </div>)
  }
}
</script>

<style scoped lang="scss">
.setting {
  height: 100%;

  &-main {
    height: calc(100% - 64px);
    display: flex;
  }
}
</style>
