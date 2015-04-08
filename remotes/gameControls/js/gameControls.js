var remote = remoteObject.client("ws://localhost:8080");

Object.has = function (object, props) {
    return props.filter(function (prop) {
        return prop in object;
    }).length > 0;
}

// taken from files.martijnbrekelmans.com/cdn/drawingCollection.js
// also works on mobile
var createMouseDragEvent = function(target) {
    "use strict";
    var lastposition;
    var keys = {};
    var listeners = [];
    target = target || window;

    window.addEventListener('keydown', function(event) {
        keys[event.key] = true;
    });

    window.addEventListener('keyup', function(event) {
        keys[event.key] = false;
    });

    target.addEventListener('mousedown', function(event) {
        lastposition = {
            x: event.clientX,
            y: event.clientY
        };

        if (event.which === 1) keys.leftMouse = true;
        else if (event.which === 3) keys.rightMouse = true;
        else if (event.which === 2) keys.middleMouse = true;

        addListener.pos = lastposition;
    });

    target.addEventListener('touchstart', function(event) {
        lastposition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        keys.leftMouse = true;
        addListener.pos = lastposition;
    });

    window.addEventListener('touchend', function() {
        keys.leftMouse = false;
    });

    window.addEventListener('touchmove', function(event) {
        var newposition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        if (keys.leftMouse) {
            listeners.forEach(function(listener) {
                listener(lastposition, newposition, keys, event);
            });
        }
        lastposition = newposition;
        addListener.pos = lastposition;
    });

    window.addEventListener('mouseup', function(event) {
        if (event.which === 1) keys.leftMouse = false;
        else if (event.which === 2) keys.middleMouse = false;
        else if (event.which === 3) keys.rightMouse = false;
    });

    window.addEventListener('mousemove', function(event) {
        var newposition = {
            x: event.clientX,
            y: event.clientY
        };

        if (keys.leftMouse || keys.middleMouse || keys.rightMouse) {
            listeners.forEach(function(listener) {
                listener(lastposition, newposition, keys, event);
            });
        }

        lastposition = newposition;
        addListener.pos = lastposition;
    });

    function addListener(listener) {
        listeners.push(listener);
        listener.unListen = function() {
            listeners.splice(listeners.indexOf(listener), 1);
        }

        return listener;
    }

    addListener.keys = keys;
    addListener.pos = {
        x: 0,
        y: 0
    };

    return addListener;
}

function createGameControls(controlsModel) {
    var pauseButton   = document.createElement("input");
    var framerate     = document.createElement("input");
    var dragEvent     = createMouseDragEvent();
    var framerateDrag = createMouseDragEvent(framerate);

    pauseButton.setAttribute("type", "button");
    pauseButton.setAttribute("value", "pause");

    // on mouse drag, continuously step frames
    dragEvent(function () {
        controlsModel.invokeFunction("step");
    });

    // on mouse drag that started on the framerate node
    framerateDrag(function (previous, current) {
        var dx = current.x - previous.x;
        controlsModel.set("framerate", controlsModel + dx / 10);
    });

    pauseButton.addEventListener("click", function () {
        // toggle paused
        controlsModel.set("paused", !controlsModel.paused);
        pauseButton.setAttribute("value", controlsModel.paused? "unpause" : "pause");
    });

    // every time the framerate gets changed, set the value of the framerate input node to the new framerate
    controlsModel.onUpdate(function (o, path, newValue) {
        if (path === "framerate") {
            framerate.setAttribute("value", o.framerate);
        }
    });

    document.body.appendChild(pauseButton);
    document.body.appendChild(framerate);
}

remote.listenForCreation(function (object, namespace, id) {
    window.setTimeout(function () {
        if (Object.has(object, ["framerate", "paused", "step"])) {
            createGameControls(object);
        }
    }, 15);
});
