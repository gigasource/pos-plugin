import cms from 'cms';
import { ref } from 'vue'
import { appHooks, posSettings } from '../AppSharedStates';
import Hooks from 'schemahandler/hooks/hooks'
export async function updatePayment(oldPayment, newPayment) {
  const settingModel = cms.getModel('PosSetting');
  if (oldPayment && !newPayment) {
    await settingModel.findOneAndUpdate(
      {},
      {
        $pull: {
          payment: {_id: oldPayment._id}
        }
      }
    )
  } else if (newPayment && !oldPayment) {
    await settingModel.findOneAndUpdate(
      {},
      {
        $push: {
          payment: {...newPayment, editable: true}
        }
      }
    )
  } else {
    await settingModel.findOneAndUpdate(
      {
        'payment._id': oldPayment._id
      },
      {
        $set: {
          'payment.$': newPayment,
        }
      }
    )
  }
  appHooks.emit('settingChange')
}

export function updateGeneralSetting() {

}

export async function updateSetting(value) {
  const settingModel = cms.getModel('PosSetting');
  await settingModel.findOneAndUpdate({}, value)
  appHooks.emit('settingChange')
}

export const settingsHooks = new Hooks()

export const currentSettingView = ref('UserSettingView')
settingsHooks.on('changeSettingView', (val) => {
  currentSettingView.value = val
})
