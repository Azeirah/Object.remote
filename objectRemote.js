// function useful for debugging.
function assert (condition, message) {
    var errorMessage = message? "Assertion error: " + message : "Assertion error.";
    if (!condition) {
        throw new Error(errorMessage);
    }
}

function assertDefined (value, message) {
    assert(value !== undefined, message);
}

(function () {
    // this code was taken from Douglas Crockford's Cycle.js
    if (typeof JSON.decycle !== 'function') {
        JSON.decycle = function decycle(object) {
            'use strict';
            var objects = [];
            var paths = [];

            return (function derez(value, path) {
                var i;
                var name;
                var nu;

                if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date) &&
                    !(value instanceof Number) &&
                    !(value instanceof RegExp) &&
                    !(value instanceof String)) {

                    for (i = 0; i < objects.length; i += 1) {
                        if (objects[i] === value) {
                            return {
                                $ref: paths[i]
                            };
                        }
                    }

                    objects.push(value);
                    paths.push(path);

                    if (Object.prototype.toString.apply(value) === '[object Array]') {
                        nu = [];
                        for (i = 0; i < value.length; i += 1) {
                            nu[i] = derez(value[i], path + '[' + i + ']');
                        }
                    } else {

                        nu = {};
                        for (name in value) {
                            if (Object.prototype.hasOwnProperty.call(value, name)) {
                                nu[name] = derez(value[name],
                                    path + '[' + JSON.stringify(name) + ']');
                            }
                        }
                    }
                    return nu;
                }
                return value;
            }(object, '$'));
        };
    }

    if (typeof JSON.retrocycle !== 'function') {
        JSON.retrocycle = function retrocycle($) {
            'use strict';
            var px = /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

            (function rez(value) {
                var i, item, name, path;

                if (value && typeof value === 'object') {
                    if (Object.prototype.toString.apply(value) === '[object Array]') {
                        for (i = 0; i < value.length; i += 1) {
                            item = value[i];
                            if (item && typeof item === 'object') {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[i] = eval(path);
                                } else {
                                    rez(item);
                                }
                            }
                        }
                    } else {
                        for (name in value) {
                            if (typeof value[name] === 'object') {
                                item = value[name];
                                if (item) {
                                    path = item.$ref;
                                    if (typeof path === 'string' && px.test(path)) {
                                        value[name] = eval(path);
                                    } else {
                                        rez(item);
                                    }
                                }
                            }
                        }
                    }
                }
            }($));
            return $;
        };
    }
}());

window.remoteObject = (function() {
    "use strict";
    var remoteObject = {};
    var currentId    = 0;

    function deepSet(obj, path, value) {
        // taken from a stackoverflow post
        // it takes an object, a path and a value, it will assign value to the path inside the object
        // deepSet({nested: {deeper: {value: 10}}}, "nested.deeper", 15);
        var elem;
        var i;
        var schema       = obj; // a moving reference to internal objects within obj
        var propertyList = path.split('.');
        var size         = propertyList.length - 1;

        for (i = 0; i < size; i += 1) {
            elem = propertyList[i];

            if (!schema[elem]) {
                schema[elem] = {};
            }

            schema = schema[elem];
        }

        schema[propertyList[size]] = value;
    }

    function deepGet(obj, path) {
        // a slightly modified version of the deepSet taken from stackoverflow
        var elem;
        var i;
        var schema = obj; // a moving reference to internal objects within obj
        var pList = path.split('.');
        var size = pList.length - 1;

        for (i = 0; i < size; i += 1) {
            elem = pList[i];

            if (!schema[elem]) {
                schema[elem] = {};
            }

            schema = schema[elem];
        }

        return schema[pList[size]];
    }

    function Channel (url, objectContainer, isClient, createRemoteObject, creationListeners) {
        // Channel requires a websocket url to connect to,
        // as well the object container that will be used to store new objects in
        //
        // isClient specifies if the channel is the client channel, or if it is a remote channel, because there is a slight difference between the two.
        [url, objectContainer, isClient, createRemoteObject, creationListeners].forEach(function (obj) {
            assertDefined(obj, "should exist");
        });

        var channel      = {};
        var messageQueue = isClient? [] : undefined;
        var that         = this;

        try {
            channel = new WebSocket(url);
        } catch (e) {
            console.log("creating a channel went wrong, remote objects will behave like normal objects");
            channel.send = function () {};
            assert(channel.readyState === 0, "When connection fails, readystate should be 0");
        }

        this.sendMessage = function(message) {
            assertDefined(channel, "channel should exist");
            // if the channel isn't ready yet, queue the message so it can be sent when it is connected
            // otherwise just send the message
            if (isClient && channel.readyState === 0) {
                messageQueue.push(message);
            } else if ((isClient && channel.readyState === 1) || !isClient) {
                // the decycling means to get rid of circular references by replacing them with a textual representation of the reference.
                channel.send(JSON.stringify(JSON.decycle(message)));
            }
        };

        channel.onopen = function() {
            assert(isClient !== undefined, "the isClient bool should be defined");
            // send all queued messages, meaning any message that was attempted to send before the channel had opened
            if (isClient) {
                that.sendMessage({
                    type: "on connection",
                    value: "client"
                });
                messageQueue.forEach(that.sendMessage);
            } else {
                that.sendMessage({
                    type: "on connection",
                    value: "remote"
                });
            }
        };

        channel.onmessage = function(message) {
            var newObject;
            var data = JSON.parse(message.data);
            var id = data.id;
            var reference;

            if (data.type === "new object") {
                newObject = createRemoteObject({}, false);

                creationListeners.forEach(function(creationListener) {
                    creationListener(newObject, id);
                });
            } else if (data.type === "deleted object") {
                objectContainer[id].remove();
                delete objectContainer[id];
            } else if (data.type === "updated object") {
                objectContainer[id].set(data.key, data.value, false);
            } else if (data.type === "add function") {
                // got a message from the client to add a remote function
                objectContainer[id][data.name] = "remote function";
            } else if (data.type === "invoke function") {
                reference = objectContainer[id][data.name];
                // we're on the remote, and we got a request to invoke a function.
                // this situation can only happen when there is one client, and two or more remotes
                // any remote but the remote that called remote.invokeFunction will get a message
                // these messages should simply be ignored, since they should be handled by the client
                // we could possibly do a callback onFunctionInvocation, so ui's can highlight whenever a function gets called or something...
                assert(typeof reference === "function");
                if (typeof reference === "function") {
                    // we're on the client, and we got a request to invoke a function.
                    // execute it
                    reference();
                }
            }
        };
    };

    function createContainer(isClient) {
        return function(url) {
            var channel;
            var objectContainer         = {};
            var objectCreationListeners = [];

            function createRemoteObject(initialValue, sendUpdate) {
                var id                  = currentId;
                var remote              = Object.create(null);
                var onUpdateListeners   = [];
                var onDeleteListeners   = [];
                var transitionListeners = [];

                objectContainer[id] = remote;

                remote.remove = function remove() {
                    channel.sendMessage({
                        type: "deleted object",
                        id: id
                    });

                    onDeleteListeners.forEach(function(listener) {
                        listener(objectContainer[id]);
                    });

                    delete objectContainer[id];
                };

                remote.set = function set(path, newValue, update) {
                    var oldValue = remote[path];
                    deepSet(remote, path, newValue);

                    // if update is set to any value (including false...)
                    // then no message will be sent to the server
                    if (update === undefined) {
                        channel.sendMessage({
                            type: "updated object",
                            id: id,
                            key: path,
                            value: newValue
                        });
                    }

                    onUpdateListeners.forEach(function(listener) {
                        listener(remote, path, newValue);
                    });

                    transitionListeners.forEach(function(config) {
                        if (config.path === path && config.oldValue === oldValue && config.newValue === newValue) {
                            config.listener(path, oldValue, newValue);
                        }
                    });
                };

                remote.setFunction = function setFunction(functionName, fn) {
                    // allows you to make clear that a function is remote-callable.
                    channel.sendMessage({
                        type: "add function",
                        id: id,
                        name: functionName
                    });
                    deepSet(remote, functionName, fn);
                };

                remote.invokeFunction = function invokeFunction(functionName) {
                    // to make this a little clearer, refer to the developer documentation.

                    // if this is the client, then it
                    // invokes a remote function "name" using parameters
                    // requires that function "name" has been set before by using
                    // setFunction
                    // invokeFunction("print", ["hello world"]);
                    var reference = deepGet(remote, functionName);

                    if (typeof reference === "function") {
                        // the client stores an -actual- reference to a function
                        // so if the fn is of type function, that means our call came from the client itself
                        // so we can safely invoke it.
                        reference.apply(null);
                    } else if (reference === "remote function") {
                        // functionRemote is a set-in-stone value I decided to use on remotes instead of the actual function reference, which the remote cannot possibly have.
                        // this means we're on the remote, and we can ping the client to invoke a function
                        channel.sendMessage({
                            type: "invoke function",
                            id: id,
                            name: functionName,
                        });
                    }
                };

                remote.onUpdate = function onUpdate(fn) {
                    onUpdateListeners.push(fn);
                };

                remote.onDelete = function onDelete(fn) {
                    onDeleteListeners.push(fn);
                };

                remote.onTransition = function onTransition(path, oldValue, newValue, listener) {
                    transitionListeners.push({
                        path: path,
                        oldValue: oldValue,
                        newValue: newValue,
                        listener: listener
                    });
                };

                currentId += 1;
                if (sendUpdate === undefined) {
                    channel.sendMessage({
                        type: "new object",
                        id: id
                    });
                    if (initialValue) {
                        // the initialValue is an object that can be passed to this function
                        // Without it, you won't be able to do this
                        // var a = {b: 10, c: 20};
                        // this is equivalent, thanks to initialValue to
                        // var a = createRemoteObject("a", {b: 10, c: 20});
                        Object.keys(initialValue).forEach(function(key) {
                            remote.set(key, initialValue[key]);
                        });
                    }
                }

                return remote;
            }

            // channel really shouldn't take createRemoteObject and objectCreationListeners
            // that really doesn't belong in its parameter list...
            channel = new Channel(url, objectContainer, isClient, createRemoteObject, objectCreationListeners);

            createRemoteObject.listenForCreation = function(fn) {
                objectCreationListeners.push(fn);
            };

            return createRemoteObject;
        };
    }

    remoteObject.client = createContainer(true);
    remoteObject.remote = createContainer(false);

    return remoteObject;
}());
