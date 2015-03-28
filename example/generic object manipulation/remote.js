var remote = remoteObject.remote("ws://localhost:8080");
var cleanups = {};

remote.listenForCreation(function (object, namespace, id) {
    if (namespace === "object") {
        window.setTimeout(function () {
            var out = document.createElement("span");
            document.querySelector("#output").appendChild(out);
            cleanups[id] = objectManipulator(object, out, namespace);

            object.onDelete(function () {
                cleanups[id]();
            });
        }, 15);
    }
});
