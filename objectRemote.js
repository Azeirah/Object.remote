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

window.remoteObject = (function () {
    "use strict";
    var remoteObject = {};
    var currentId    = 0;

    function deepSet(obj, path, value) {
        // stolen from a stackoverflow post
        // it takes an object, a path and a value, it will assign value to the path inside the object
        // deepSet({nested: {deeper: {value: 10}}}, "nested.deeper", 15);
        var elem;
        var i;
        var schema = obj; // a moving reference to internal objects within obj
        var pList  = path.split('.');
        var size   = pList.length - 1;

        for (i = 0; i < size; i += 1) {
            elem = pList[i];

            if (!schema[elem]) {
                schema[elem] = {};
            }

            schema = schema[elem];
        }

        schema[pList[size]] = value;
    }

    var Channel = function (url, objectContainer, isClient, createRemoteObject, creationListeners) {
        // Channel requires a websocket url to connect to,
        // as well the object container that will be used to store new objects in
        //
        // the last argument specifies if the channel is the client channel, or if it is a remote channel, because there is a slight difference between the two.
        var channel      = new WebSocket(url);
        var messageQueue = isClient ? [] : undefined;
        var that         = this;

        this.sendMessage = function (message) {
            // if the channel isn't ready yet, queue the message so it can be sent when it is connected
            // otherwise just send the message
            if (isClient && channel.readyState === 0) {
                messageQueue.push(message);
            } else if ((isClient && channel.readyState === 1) || !isClient) {
                // the decycling means to get rid of circular references by replacing them with a textual representation of the reference.
                channel.send(JSON.stringify(JSON.decycle(message)));
            }
        };

        channel.onopen = function () {
            // send all queued messages, meaning any message that was attempted to send before the channel had opened
            if (isClient) {
                messageQueue.forEach(that.sendMessage);
            }
        };

        channel.onmessage = function (message) {
            var newObject;
            var data      = JSON.parse(message.data);
            var id        = data.id;
            var namespace = data.namespace;

            if (data.type === "new object") {
                if (objectContainer[namespace] === undefined) {
                    objectContainer[namespace] = Object.create(null);
                }

                newObject = createRemoteObject(namespace, {}, false);

                creationListeners.forEach(function (creationListener) {
                    creationListener(newObject, namespace, id);
                });
            } else if (data.type === "deleted object") {
                objectContainer[namespace][id].remove();
                delete objectContainer[namespace][id];
            } else if (data.type === "updated object") {
                objectContainer[namespace][id].set(data.key, data.value, false);
                // deepSet(objectContainer[namespace][id], data.key, data.value);
            }
        };
    };

    function createContainer(isClient) {
        return function (url) {
            var channel;
            var objectContainer         = {};
            var objectCreationListeners = [];

            function createRemoteObject(objectNamespace, initialValue, sendUpdate) {
                var id                = currentId;
                var remote            = Object.create(null);
                var onUpdateListeners = [];
                var onDeleteListeners = [];

                // create the namespace if it didn't exist before
                if (objectContainer[objectNamespace] === undefined) {
                    objectContainer[objectNamespace] = Object.create(null);
                }

                objectContainer[objectNamespace][id] = remote;

                remote.remove = function remove() {
                    channel.sendMessage({
                        namespace: objectNamespace,
                        type: "deleted object",
                        id: id
                    });

                    onDeleteListeners.forEach(function (listener) {
                        listener(objectContainer[objectNamespace][id]);
                    });

                    delete objectContainer[objectNamespace][id];
                };

                remote.set = function set(path, newValue, update) {
                    deepSet(remote, path, newValue);

                    // update is a boolean used to disable sending the message to the server
                    // this is useful for when you want to use this function as an actual
                    // object set operation, instead of an update broadcast
                    if (update === undefined) {
                        channel.sendMessage({
                            namespace: objectNamespace,
                            type     : "updated object",
                            id       : id,
                            key      : path,
                            value    : newValue
                        });
                    }

                    onUpdateListeners.forEach(function (listener) {
                        listener(remote, path, newValue);
                    });
                };

                remote.onUpdate = function onUpdate(fn) {
                    onUpdateListeners.push(fn);
                };

                remote.onDelete = function onDelete(fn) {
                    onDeleteListeners.push(fn);
                };

                currentId += 1;
                if (sendUpdate === undefined) {
                    channel.sendMessage({
                        namespace: objectNamespace,
                        type: "new object",
                        id: id
                    });
                    if (initialValue) {
                        // the initialValue is an object that can be passed to this function
                        // Without it, you won't be able to do this
                        // var a = {b: 10, c: 20};
                        // this is equivalent, thanks to initialValue to
                        // var a = createRemoteObject("a", {b: 10, c: 20});
                        Object.keys(initialValue).forEach(function (key) {
                            remote.set(key, initialValue[key]);
                        });
                    }
                }


                return remote;
            }

            channel = new Channel(url, objectContainer, isClient, createRemoteObject, objectCreationListeners);

            createRemoteObject.listenForCreation = function (fn) {
                objectCreationListeners.push(fn);
            };

            createRemoteObject.retrieveNamespace = function (namespace) {
                return objectContainer[namespace];
            };

            return createRemoteObject;
        };
    }

    remoteObject.client = createContainer(true);
    remoteObject.remote = createContainer(false);

    return remoteObject;
}());
