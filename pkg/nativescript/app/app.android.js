console.log("NativeScript is running");
var cb = new io.gigasource.nodebridge.CallFromNS({
    callback: function (msg) { console.log(msg) }
})
io.gigasource.nodebridge.Listener.setCall(cb);
