/**
 * This file is used for storing & deleting messages created by emitToPersistent
 */

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  targetClientId: ObjectId,
  event: {
    type: String,
    trim: true,
  },
  args: Array,
  ackFnName: {
    type: String,
    trim: true,
  },
  ackFnArgs: Array,
  usageCount: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true
});
messageSchema.index({createdAt: 1},{expireAfterSeconds: 30 * 86400}); // delete saved messages if not sent after 30 days

const SocketIOSavedMessagesModel = mongoose.model('SocketIOSavedMessage', messageSchema);

function updateMessage(targetClientId, _id, update) {
  return SocketIOSavedMessagesModel.findByIdAndUpdate(_id, update).exec();
}

async function saveMessage(targetClientId, message) {
  const result = await SocketIOSavedMessagesModel.create(Object.assign({targetClientId}, message));
  return result._id;
}

function deleteMessage(targetClientId, _id) {
  return SocketIOSavedMessagesModel.deleteOne({_id}).exec();
}

function loadMessages(targetClientId) {
  return SocketIOSavedMessagesModel.find({targetClientId});
}

module.exports = {
  SocketIOSavedMessagesModel,
  updateMessage,
  saveMessage,
  deleteMessage,
  loadMessages,
}
