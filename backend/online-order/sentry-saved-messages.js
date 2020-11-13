const SentrySavedMessagesModel = cms.getModel('SentrySavedMessage');

async function sendSavedMessages() {
  try {
    const docs = await SentrySavedMessagesModel.find({});

    const savedSentryMessageIds = docs.map(({_id}) => _id);
    SentrySavedMessagesModel.deleteMany({_id: {$in: savedSentryMessageIds}}).exec();
    docs.forEach(({tagString, message}) => {
      console.debug(tagString, message);
    });
  } catch (e) {
    console.error(e);
  }
}

async function saveDisconnectMessage(onlineOrderSocket) {
  if (onlineOrderSocket.clientId) return SentrySavedMessagesModel.create({
    tagString: `sentry:clientId=${onlineOrderSocket.clientId},eventType=socketConnection,socketId=${onlineOrderSocket.serverSocketId}`,
    message: `2b. (Startup) onlineOrderSocket disconnected`,
  });
}

module.exports = {
  sendSavedMessages,
  saveDisconnectMessage,
}
