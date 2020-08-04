// Rename this sample file to main.js to use on your project.
// The main.js file will be overwritten in updates/reinstalls.

var rn_bridge = require('rn-bridge');
module.exports = async cms => {
  if (rn_bridge) {
    cms.execPost('NotifyReact', null ,[],() => {
      console.log('Start node');
      rn_bridge.channel.send("NodeStarted");
    })
    cms.socket.on('connect', async socket => {
      socket.on('shutDownNode', () => {
        rn_bridge.channel.send("StopNode");
      })
    })
  }
}
// Echo every message received from react-native.
// rn_bridge.channel.on('message', (msg) => {
//   rn_bridge.channel.send(msg);
// } );

// Inform react-native node is initialized.
// rn_bridge.channel.send("Node was initialized.");
