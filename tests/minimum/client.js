// this is a basic test to check if the most important functionality works, namely, sending object notifications to a remote client, and receiving object notifications from said client.

// create an instance of a createRemoteObject function
var createRemoteObject = remoteObject.client("ws://localhost:8080");

// this is the remote equivalent of
// var justATestObject = Object.create(null);
var justATestObject = createRemoteObject();

// justATestObject.a = 15;
justATestObject.set("a", 15);

var out = document.createElement("pre");
document.body.appendChild(out);

setInterval(function () {
    out.innerHTML = JSON.stringify(justATestObject, null, 4);
}, 1/60);
