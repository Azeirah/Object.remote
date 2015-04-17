var remote = remoteObject.remote("ws://localhost:8080");
var container = document.querySelector("#container");

// taken from files.martijnbrekelmans.com/cdn/drawingCollection.js
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

function svgElement(name) {
    // I suppose this won't work without an internet connection?
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function createPoint(pointModel) {
    function updatePoint() {
        circle.setAttribute("cx", pointModel.x);
        circle.setAttribute("cy", pointModel.y);
    }

    var circle = svgElement("circle");

    circle.setAttribute("r", 10);
    circle.setAttribute("stroke", "orangered");
    circle.setAttribute("fill", "orange");
    circle.setAttribute("stroke-width", 3);
    container.appendChild(circle);
    updatePoint();

    pointModel.onDelete(function () {
        // goodbye circle :(
        container.removeChild(circle);
    });

    var onCircleDrag = createMouseDragEvent(circle);
    onCircleDrag(function (prev, current) {
        var dx = current.x - prev.x;
        var dy = current.y - prev.y;

        pointModel.set("x", pointModel.x + dx);
        pointModel.set("y", pointModel.y + dy);
    });

    pointModel.onUpdate(updatePoint);
}

remote.listenForCreation(function (object, id) {
    window.setTimeout(function () {
        console.log("new object received!");
        // check if it's a point
        if (object.x && object.y) {
            createPoint(object);
        }
    }, 15);
});
