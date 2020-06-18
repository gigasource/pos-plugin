const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SentrySavedMessagesModel = mongoose.model('SentrySavedMessage', new Schema({
  tagString: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
}));

function sendSavedMessages() {
  SentrySavedMessagesModel.find({}, (err, docs) => {
    if (err) return console.error(err);

    const savedSentryMessageIds = docs.map(({_id}) => _id);
    SentrySavedMessagesModel.deleteMany({_id: {$in: savedSentryMessageIds}}).exec();
    docs.forEach(({tagString, message}) => {
      console.debug(tagString, message);
    });
  });
}

function saveDisconnectMessage(onlineOrderSocket) {
  return SentrySavedMessagesModel.create({
    tagString: `sentry:clientId=${onlineOrderSocket.clientId},eventType=socketConnection,socketId=${onlineOrderSocket.serverSocketId}`,
    message: `2b. (Startup) onlineOrderSocket disconnected`,
  });
}

module.exports = {
  sendSavedMessages,
  saveDisconnectMessage,
}
