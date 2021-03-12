import cms from 'cms';
import { appHooks } from '../AppSharedStates';

export async function updatePayment(oldPayment, newPayment) {
  const settingModel = cms.getModel('PosSetting');
  if (oldPayment && !newPayment) {
    await settingModel.findOneAndUpdate(
      {},
      {
        $pull: {
          payment: { _id: oldPayment._id }
        }
      }
    )
  } else if (newPayment && !oldPayment) {
    await settingModel.findOneAndUpdate(
      {},
      {
        $push: {
          payment: { ...newPayment, editable: true }
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

export async function updateSetting(value) {
  const settingModel = cms.getModel('PosSetting');
  await settingModel.findOneAndUpdate({}, value)
  appHooks.emit('settingChange')
}

