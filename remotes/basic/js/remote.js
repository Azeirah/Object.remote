var remote = remoteObject.remote("ws://localhost:8080");
// hold references to cleanup functions to react elements, look in objectManipulator.js to see that component&objectManipulator return functions which are used to clean themselves up.
var cleanups = {};

remote.listenForCreation(function (object, namespace, id) {
    if (namespace === "component") {
        window.setTimeout(function () {
            // append a span to the output area, so react can render a card inside it
            var out = document.createElement("span");
            document.querySelector("#output").appendChild(out);
            cleanups[id] = componentManipulator(object, out, object.name);

            object.onDelete(function () {
                // remove the card whenever an object gets deleted
                cleanups[id]();
            });
        }, 15);
    } else {
        window.setTimeout(function () {
            // append a span to the output area, so react can render a card inside it
            var out = document.createElement("span");
            document.querySelector("#output").appendChild(out);
            cleanups[id] = objectManipulator(object, out, namespace);

            object.onDelete(function () {
                // remove the card whenever an object gets deleted
                cleanups[id]();
            });
        }, 15);
    }
});
