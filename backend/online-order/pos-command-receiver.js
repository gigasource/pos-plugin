function getLatestOrder() {
  const OrderModel = cms.getModel('Order');
  return OrderModel.findOne();
}

const commandMap = {
  getLatestOrder,
}

function init(socket) {
  socket.on('posCommand:send', async (command, ackFn) => {
    const commandArray = command.split(' ');
    let commandArgs = [];

    if (commandArray.length > 1) {
      command = commandArray.shift();
      commandArgs = commandArray;
    }

    if (!commandMap[command]) {
      ackFn('Error: Invalid command');
    } else {
      const fn = commandMap[command];
      const commandResult = await Promise.resolve(fn(...commandArgs));
      ackFn(commandResult);
    }
  });
}

module.exports = init;
