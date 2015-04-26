// this is a basic test to check if the most important functionality works, namely, sending object notifications to a remote client, and receiving object notifications from said client.

var receivedObject;
// create an instance of a createRemoteObject function, as a remote client
var remote = remoteObject.remote("ws://localhost:8080");

remote.listenForCreation(function (object, id) {
    receivedObject = object;
    setTimeout(function () {
        // 1.5 seconds after an object has been received, set its "a" value to 200
        object.set("a", 200);
    }, 1500);
});

var out = document.createElement("pre");
document.body.appendChild(out);

setInterval(function () {
    if (receivedObject) {
        out.innerHTML = JSON.stringify(receivedObject, null, 4);  
    }
}, 1/ 60);
