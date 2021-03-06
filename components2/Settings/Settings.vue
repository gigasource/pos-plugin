<script>
import { KeepAlive, Component, h} from 'vue'
import viewGeneral from './viewGeneral';
import viewCompany from './viewCompany';
import viewPayment from './PaymentSetting/viewPayment';
import viewTax from './TaxSetting/viewTax';
import viewUser from './UserSetting/viewUser';
import viewUserToolbar from './UserSetting/viewUserToolbar';
import viewTaxToolbar from './TaxSetting/viewTaxToolbar';
import viewPaymentToolbar from './PaymentSetting/viewPaymentToolbar';
import PosSettingsScreenSidebar from './PosSettingsScreenSidebar';
import { genScopeId } from '../utils';
import PosSettingsScreenToolbar from './PosSettingsScreenToolbar';
import CallSystem from './CallSystem/CallSystem';
import CustomerScreenConfig from './CustomerScreenConfig/CustomerScreenConfig';
import OnlineOrderSetting from './OnlineOrderSetting/OnlineOrderSetting';
import PosOrderDeliveryConfig from './DeliverySetting/PosOrderDeliveryConfig'
import CustomerLedDisplay from './CustomerScreenConfig/CustomerLedDisplay';
import { VIEWS, currentSettingView } from './settings-shared';

export default {
  components: { CustomerLedDisplay, PosOrderDeliveryConfig, OnlineOrderSetting, CustomerScreenConfig, CallSystem, PosSettingsScreenToolbar, viewGeneral, viewUser, viewPayment, viewTax, viewCompany, viewUserToolbar, viewTaxToolbar, viewPaymentToolbar, PosSettingsScreenSidebar},
  setup() {
    const GeneralSettingView = <viewGeneral style="flex: 1"/>
    const UserSettingView = <viewUser style="flex: 1"/>
    const CompanyInfoSettingView =<viewCompany style="flex: 1"/>
    const PaymentSettingView = <viewPayment style="flex: 1"/>
    const TaxSettingView = <viewTax style="flex: 1"/>
    const CallSystemSettingView = <CallSystem style="flex: 1"/>
    const CustomerScreenSettingView = <CustomerScreenConfig style="flex: 1"/>
    const OnlineOrderSettingView = <OnlineOrderSetting style="flex: 1"/>
    const DeliverySettingView = <PosOrderDeliveryConfig style="flex: 1"/>
    const UserToolbar = <viewUserToolbar></viewUserToolbar>
    const PaymentToolbar = <viewPaymentToolbar></viewPaymentToolbar>
    const TaxToolbar = <viewTaxToolbar></viewTaxToolbar>
    const CustomerLedDisplayView = <customer-led-display/>
    let views = {}
    views[VIEWS.GENERAL_SETTING_VIEW] = GeneralSettingView
    views[VIEWS.USER_SETTING_VIEW] = UserSettingView
    views[VIEWS.COMPANY_INFO_SETTING_VIEW] = CompanyInfoSettingView
    views[VIEWS.PAYMENT_SETTING_VIEW] = PaymentSettingView
    views[VIEWS.TAX_SETTING_VIEW] = TaxSettingView
    views[VIEWS.CALL_SYSTEM_SETTING_VIEW] = CallSystemSettingView
    views[VIEWS.CUSTOMER_SCREEN_SETTING_VIEW] = CustomerScreenSettingView
    views[VIEWS.ONLINE_ORDER_SETTING_VIEW] = OnlineOrderSettingView
    views[VIEWS.DELIVERY_SETTING_VIEW] = DeliverySettingView
    views[VIEWS.CUSTOMER_LED_DISPLAY_VIEW] = CustomerLedDisplayView

    const toolbars = {
      UserSettingView: UserToolbar,
      PaymentSettingView: PaymentToolbar,
      TaxSettingView: TaxToolbar
    }
    return genScopeId(() =>
      <div class="setting">
        <div class="setting-main">
          <PosSettingsScreenSidebar>
          </PosSettingsScreenSidebar>
          <KeepAlive>
            {h(views[currentSettingView.value])}
          </KeepAlive>
        </div>
        <PosSettingsScreenToolbar>
          {h(toolbars[currentSettingView.value])}
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
