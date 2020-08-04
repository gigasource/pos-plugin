console.log('NativeScript is running');
var ee = require('event-emitter');
var Emitter = function () { /* .. */ };
ee(Emitter.prototype); // All instances of Emitter will expose event-emitter interface
global.emitter = new Emitter();

var BridgeListener = NSObject.extend({
    init: function() {
        var self = this.super.init();
        if (self) {
            // The base class initialized successfully
            console.log("Initialized");
        }
        return self;
    },
    doCall: function(msg) {
        //todo: add emit here
        emitter.emit(msg);
    }
})

const application = require("tns-core-modules/application");

var listener = new BridgeListener();

setTimeout(() => {
    Listener.setDelegate(listener);
}, 1000)

application.run({ moduleName: "app-root" });

