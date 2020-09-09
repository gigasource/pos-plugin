function getLatestOrder() {
  const OrderModel = cms.getModel('Order');
  return OrderModel.findOne();
}

const commandMap = {
  getLatestOrder,
}

function init(socket) {
  socket.on('posCommand:send', async (command, ackFn) => {
    if (!commandMap[command]) {
      ackFn('Error: Invalid command');
    } else {
      const fn = commandMap[command];
      const commandResult = await Promise.resolve(fn());
      ackFn(commandResult);
    }
  });
}

module.exports = init;
