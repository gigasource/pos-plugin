const {getExternalSocketIOServer} = require('../../external-socket-server');

const StoreModel = cms.getModel('Store');
const DeviceModel = cms.getModel('Device');
const ProductModel = cms.getModel('Product');
const DiscountModel = cms.getModel('Discount');
const RoleModel = cms.getModel('Role');
const UserModel = cms.getModel('User');
const StoreGroupModel = cms.getModel('StoreGroup');

function createStoreEventListeners(socket) {
  socket.on('removeStore', async (storeId, cb) => {
    const devices = await DeviceModel.find({storeId});
    const deviceIds = devices.map(i => i._id);

    // remove store
    await StoreModel.deleteOne({_id: storeId});

    // remove devices & unpair all
    await DeviceModel.deleteMany({_id: {$in: deviceIds}});
    deviceIds.forEach(i => getExternalSocketIOServer().emitToPersistent(i, 'unpairDevice'));

    // remove products
    await ProductModel.deleteMany({store: storeId});

    // remove discounts
    await DiscountModel.deleteMany({store: storeId})

    // remove store owner user
    const deviceRole = await RoleModel.findOne({name: 'device'});
    await UserModel.deleteOne({role: deviceRole._id, store: storeId});

    // run callback
    if (typeof cb === 'function') cb();
  });

  socket.on('removeStoreGroup', async _id => {
    // check for stores in group
    const storesInGroup = await cms.getModel('Store').find({group: _id});

    if (!storesInGroup || !storesInGroup.length) {
      await StoreGroupModel.deleteOne({_id});

      // pull from other users' store groups
      // TODO: check this
      await UserModel.updateMany();

      // refresh display
      cms.socket.emit('loadStore');
    }
  });
}

module.exports = createStoreEventListeners;
