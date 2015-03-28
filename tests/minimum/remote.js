// this is a basic test to check if the most important functionality works, namely, sending object notifications to a remote client, and receiving object notifications from said client.

// create an instance of a createRemoteObject function, as a remote client
var remote = remoteObject.remote("ws://localhost:8080");

remote.listenForCreation(function (object, namespace, id) {
    if (namespace === "test") {
        // the test client uses namespace "test" to send objects of this kind.
        setTimeout(function () {
            // 1.5 seconds after an object has been received, set its "a" value to 200
            object.set("a", 200);
        }, 1500);
    }
});

var out = document.createElement("pre");
document.body.appendChild(out);

setInterval(function () {
    out.innerHTML = JSON.stringify(remote.retrieveNamespace("test")[0], null, 4);
}, 1/ 60);
