const SentrySavedMessagesModel = cms.getModel('SentrySavedMessage');

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
  if (onlineOrderSocket.clientId) return SentrySavedMessagesModel.create({
    tagString: `sentry:clientId=${onlineOrderSocket.clientId},eventType=socketConnection,socketId=${onlineOrderSocket.serverSocketId}`,
    message: `2b. (Startup) onlineOrderSocket disconnected`,
  });
}

module.exports = {
  sendSavedMessages,
  saveDisconnectMessage,
}
