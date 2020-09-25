const DeviceModel = cms.getModel('Device');
const StoreModel = cms.getModel('Store');

const {getExternalSocketIOServer} = require('../index');

function createDeviceEventListeners(socket) {
  socket.on('registerMasterDevice', async (ip) => {
    await DeviceModel.findOneAndUpdate({ _id: clientId }, { master: true, 'metadata.ip': ip});
  })

  socket.on('emitToAllDevices', async (commits, storeAlias) => {
    const storeId = await StoreModel.findOne({ alias: storeAlias });
    const devices = await DeviceModel.find({ storeId: storeId._doc._id, paired: true });

    devices.forEach((device) => {
      getExternalSocketIOServer().emitTo(device._id.toString(), 'updateCommitNode', commits);
    });
  })

  socket.on('getMasterIp', async (storeAlias, fn) => {
    const storeId = await StoreModel.findOne({ alias: storeAlias });
    const device = await DeviceModel.findOne({ storeId: storeId._doc._id, paired: true, master: true }).lean();
    fn(device.metadata.ip, device._id.toString());
  })
}

module.exports = createDeviceEventListeners;
