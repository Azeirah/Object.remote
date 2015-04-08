(function() {
    /*
        cycle.js
        2015-02-25
        Public Domain.
        NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
        This code should be minified before deployment.
        See http://javascript.crockford.com/jsmin.html
        USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
        NOT CONTROL.
    */

    /*jslint eval, for */

    /*property
        $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
        retrocycle, stringify, test, toString
    */

    if (typeof JSON.decycle !== 'function') {
        JSON.decycle = function decycle(object) {
            'use strict';

            // Make a deep copy of an object or array, assuring that there is at most
            // one instance of each object or array in the resulting structure. The
            // duplicate references (which might be forming cycles) are replaced with
            // an object of the form
            //      {$ref: PATH}
            // where the PATH is a JSONPath string that locates the first occurance.
            // So,
            //      var a = [];
            //      a[0] = a;
            //      return JSON.stringify(JSON.decycle(a));
            // produces the string '[{"$ref":"$"}]'.

            // JSONPath is used to locate the unique object. $ indicates the top level of
            // the object or array. [NUMBER] or [STRING] indicates a child member or
            // property.

            var objects = [], // Keep a reference to each unique object or array
                paths = []; // Keep the path to each unique object or array

            return (function derez(value, path) {

                // The derez recurses through the object, producing the deep copy.

                var i, // The loop counter
                    name, // Property name
                    nu; // The new object or array

                // typeof null === 'object', so go on if this value is really an object but not
                // one of the weird builtin objects.

                if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date) &&
                    !(value instanceof Number) &&
                    !(value instanceof RegExp) &&
                    !(value instanceof String)) {

                    // If the value is an object or array, look to see if we have already
                    // encountered it. If so, return a $ref/path object. This is a hard way,
                    // linear search that will get slower as the number of unique objects grows.

                    for (i = 0; i < objects.length; i += 1) {
                        if (objects[i] === value) {
                            return {
                                $ref: paths[i]
                            };
                        }
                    }

                    // Otherwise, accumulate the unique value and its path.

                    objects.push(value);
                    paths.push(path);

                    // If it is an array, replicate the array.

                    if (Object.prototype.toString.apply(value) === '[object Array]') {
                        nu = [];
                        for (i = 0; i < value.length; i += 1) {
                            nu[i] = derez(value[i], path + '[' + i + ']');
                        }
                    } else {

                        // If it is an object, replicate the object.

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

            // Restore an object that was reduced by decycle. Members whose values are
            // objects of the form
            //      {$ref: PATH}
            // are replaced with references to the value found by the PATH. This will
            // restore cycles. The object will be mutated.

            // The eval function is used to locate the values described by a PATH. The
            // root object is kept in a $ variable. A regular expression is used to
            // assure that the PATH is extremely well formed. The regexp contains nested
            // * quantifiers. That has been known to have extremely bad performance
            // problems on some browsers for very long strings. A PATH is expected to be
            // reasonably short. A PATH is allowed to belong to a very restricted subset of
            // Goessner's JSONPath.

            // So,
            //      var s = '[{"$ref":"$"}]';
            //      return JSON.retrocycle(JSON.parse(s));
            // produces an array containing a single element which is the array itself.

            var px = /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

            (function rez(value) {

                // The rez function walks recursively through the object looking for $ref
                // properties. When it finds one that has a value that is a path, then it
                // replaces the $ref object with a reference to the value that is found by
                // the path.

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

(function() {
    // polyfill for [].fill, stolen from the MDN
    if (!Array.prototype.fill) {
        Array.prototype.fill = function(value) {

            // Steps 1-2.
            if (this == null) {
                throw new TypeError('this is null or not defined');
            }

            var O = Object(this);

            // Steps 3-5.
            var len = O.length >>> 0;

            // Steps 6-7.
            var start = arguments[1];
            var relativeStart = start >> 0;

            // Step 8.
            var k = relativeStart < 0 ?
                Math.max(len + relativeStart, 0) :
                Math.min(relativeStart, len);

            // Steps 9-10.
            var end = arguments[2];
            var relativeEnd = end === undefined ?
                len : end >> 0;

            // Step 11.
            var final = relativeEnd < 0 ?
                Math.max(len + relativeEnd, 0) :
                Math.min(relativeEnd, len);

            // Step 12.
            while (k < final) {
                O[k] = value;
                k++;
            }

            // Step 13.
            return O;
        };
    }

    // adds a String.format function to String
    // can be used like with a format object or with a list of arguments
    // "Hi my name is {0} and I'm a {1}".format("Martijn", "wizard")                                 -> Hi my name is Martijn and I'm a wizard
    // "Hi my name is {name} and I'm a {profession}".format({name: "Martijn", profession: "wizard"}) -> Hi my name is Martijn and I'm a wizard
    if (!String.prototype.format) {
        // this code is ugly because it is an uglified version of String.prototype.formatUnicorn stolen from stackoverflow (literally, it belongs to stackoverflow's codebase)
        String.prototype.format = function() {
            "use strict";
            var e = this.toString();
            if (!arguments.length) {
                return e;
            }
            var t = typeof arguments[0],
                n = "string" == t || "number" == t ? Array.prototype.slice.call(arguments) : arguments[0];

            for (var i in n) {
                e = e.replace(new RegExp("\\{" + i + "\\}", "gi"), n[i]);
            }

            return e
        }
    }

    // adds remove functions to elements and nodelists.
    Element.prototype.remove = function() {
        this.parentNode.removeChild(this);
    };

    NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
        for (var i = 0, len = this.length; i < len; i++) {
            if (this[i] && this[i].parentElement) {
                this[i].parentElement.removeChild(this[i]);
            }
        }
    };

    NodeList.prototype.forEach = HTMLCollection.prototype.forEach = function(fn) {
        for (var i = 0; i < this.length; i++) {
            fn(this[i], i, this);
        }
    };

    // adds forEach to Objects
    // Object.prototype.forEach = function (fn) {
    //     var that = this;

    //     Object.keys.forEach(function (key, i) {
    //         fn(that[key], i, key, that);
    //     });
    // };
}());

window.remoteObject = (function() {
    "use strict";
    var remoteObject = {};
    var currentId = 0;

    function deepSet(obj, path, value) {
        // stolen from a stackoverflow post
        // it takes an object, a path and a value, it will assign value to the path inside the object
        // deepSet({nested: {deeper: {value: 10}}}, "nested.deeper", 15);
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

        schema[pList[size]] = value;
    }

    function deepGet(obj, path) {
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

    var Channel = function(url, objectContainer, isClient, createRemoteObject, creationListeners) {
        // Channel requires a websocket url to connect to,
        // as well the object container that will be used to store new objects in
        //
        // the last argument specifies if the channel is the client channel, or if it is a remote channel, because there is a slight difference between the two.
        var channel = {};
        try {
            channel = new WebSocket(url);
        } catch (e) {
            console.log("creating a channel went wrong, remote objects will behave like normal objects");
            channel.send = function () {};
            channel.readyState === 0;
        }
        var messageQueue = isClient ? [] : undefined;
        var that = this;

        this.sendMessage = function(message) {
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
            // send all queued messages, meaning any message that was attempted to send before the channel had opened
            if (isClient) {
                messageQueue.forEach(that.sendMessage);
            }
        };

        channel.onmessage = function(message) {
            var newObject;
            var data = JSON.parse(message.data);
            var id = data.id;
            var namespace = data.namespace;

            if (data.type === "new object") {
                if (objectContainer[namespace] === undefined) {
                    objectContainer[namespace] = Object.create(null);
                }

                newObject = createRemoteObject(namespace, {}, false);

                creationListeners.forEach(function(creationListener) {
                    creationListener(newObject, namespace, id);
                });
            } else if (data.type === "deleted object") {
                objectContainer[namespace][id].remove();
                delete objectContainer[namespace][id];
            } else if (data.type === "updated object") {
                objectContainer[namespace][id].set(data.key, data.value, false);
            } else if (data.type === "add function") {
                // got a message from the client to add a remote function
                objectContainer[namespace][id][data.name] = "remote function";
            } else if (data.type === "invoke function") {
                var reference = objectContainer[namespace][id][data.name];
                if (typeof reference === "function") {
                    // we're on the client, and we got a request to invoke a function.
                    // execute it
                    reference();
                } else {
                    // we're on the remote, and we got a request to invoke a function.
                    // this situation can only happen when there is one client, and two or more remotes
                    // any remote but the remote that called remote.invokeFunction will get a message
                    // these messages should simply be ignored, since they should be handled by the client
                    // we could possibly do a callback onFunctionInvocation, so ui's can highlight whenever a function gets called or something...
                }
            }
        };
    };

    function createContainer(isClient) {
        return function(url) {
            var channel;
            var objectContainer = {};
            var objectCreationListeners = [];

            function createRemoteObject(objectNamespace, initialValue, sendUpdate) {
                var id = currentId;
                var remote = Object.create(null);
                var onUpdateListeners = [];
                var onDeleteListeners = [];
                var transitionListeners = [];

                // seeing my point editor demo, I'm not sure if a namespace is really necessary.
                // it's possible to detect types using checks if certain properties exist, ex if (object.x && object.y) {...}
                // and you could also define types in the client environment, using
                // createRemoteObject({x: 10, y: 20, type: "point"}) or something
                //
                // I think it's more important for each CLIENT to have a namespace of sorts, clients should NEVER be able to interact with each other, which is currently very possible.

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

                    onDeleteListeners.forEach(function(listener) {
                        listener(objectContainer[objectNamespace][id]);
                    });

                    delete objectContainer[objectNamespace][id];
                };

                remote.set = function set(path, newValue, update) {
                    var oldValue = remote[path];
                    deepSet(remote, path, newValue);

                    // update is a boolean used to disable sending the message to the server
                    // this is useful for when you want to use this function as an actual
                    // object set operation, instead of an update broadcast
                    if (update === undefined) {
                        channel.sendMessage({
                            namespace: objectNamespace,
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
                    // tells remote clients that a function "name" can be invoked remotely
                    // parameterTypes is an array of types that the function requires
                    // ex, remote.setFunction("print", console.log.bind(console), ["string"])
                    // at the moment, this does NOT support objects or arrays, only numbers, strings and booleans
                    channel.sendMessage({
                        namespace: objectNamespace,
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
                            namespace: objectNamespace,
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
                        Object.keys(initialValue).forEach(function(key) {
                            remote.set(key, initialValue[key]);
                        });
                    }
                }


                return remote;
            }

            channel = new Channel(url, objectContainer, isClient, createRemoteObject, objectCreationListeners);

            createRemoteObject.listenForCreation = function(fn) {
                objectCreationListeners.push(fn);
            };

            createRemoteObject.retrieveNamespace = function(namespace) {
                return objectContainer[namespace];
            };

            return createRemoteObject;
        };
    }

    remoteObject.client = createContainer(true);
    remoteObject.remote = createContainer(false);

    return remoteObject;
}());


var keys = (function() {
    var Keys = {};
    var allKeys = {};
    var listeners = [];

    Array.prototype.slice.call("abcdefghijklmnopqrstuvwxyz").forEach(function(letter) {
        allKeys[letter] = false;
    });

    function onKey(returnValue) {
        return function(event) {
            var chr = String.fromCharCode(event.keyCode).toLowerCase();
            allKeys[chr] = returnValue;

            listeners.forEach(function(listener) {
                if (returnValue === true ? listener.keydown : listener.keyup && chr === listener.key) {
                    listener.callback();
                }
            });
        };
    }

    window.addEventListener("keydown", onKey(true));
    window.addEventListener("keyup", onKey(false));

    Keys.keyup = function(key, listener) {
        listeners.push({
            callback: listener,
            key: key,
            keyup: true
        });
    };

    Keys.keydown = function(key, listener) {
        listeners.push({
            callback: listener,
            key: key,
            keydown: true
        });
    };

    Keys.keyStates = allKeys;

    return Keys;
}());

var createRemoteObject = remoteObject.client("");

// restricts a number between a minimum value and a maximum value
// constrain(50, 0, 100) -> 50
// constrain(200, 0, 100) -> 100
// constrain(5, 10, 20) -> 5
function constrain(value, minimum, maximum) {
    "use strict";
    if (value < minimum) return minimum;
    if (value > maximum) return maximum;
    return value;
}

function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

// adds properties from obj2 on to obj1.
// extend({name: "harold"}, {age: 55}) -> {name: "harold", age: 55}
// extend overwrites properties on the first object with properties on the second object
// It will give a warning when this happens however.
function extend(obj1, obj2) {
    Object.keys(obj2).forEach(function(key) {
        if (obj1.hasOwnProperty(key)) {
            console.warn("overwriting property " + key + " on", obj1);
            console.trace();
        }
        obj1[key] = obj2[key];
    });
    return obj1;
}

// A function that does exactly nothing.
var noop = Function.prototype;

// components like classes with some cool added functionality, such as a built-in state machine and easy inheritance.
// these components are partially inspired by Facebook's React
/*

var Point = component({
    // getInitialState describes the initial state of the component
    getInitialState: function () {
        return {x: 5, y: 10};
    },
    // onCreate gets called when the object gets instantiated, it's similar to a constructor, only it gets called after getInitialState
    onCreate: function () {
        // every function has access to this.state and this.props, except for getInitialState, which only has access to the props.
        console.log(this.state) -> {x: 5, y: 10};

        // props is the object passed to a component when it is instantiated, these mustn't be changed.
        console.log(this.props) -> {name: "first point"} (for the first instantiation, see below)
                                   {name: "second point"} (for the second instantiation, see below)

        // this onCreate function is almost always used to listen for js events or listen to other objects but can be used for other things

        this.describe();
    },
    // there are no other predefined functions on components, here you can define your own functions
    // all of these functions will have access to the component's state, props and other functions defined on the same component.
    describe: function () {
        console.log("I'm a point at ({x}, {y})".format({x: this.state.x, y: this.state.y}));
    }
})

 */

var component = (function() {
    var currentId = 0;
    var Components = {};
    var Blueprints = [];
    var creationListeners = [];
    var deletionListeners = [];
    var methodCallListeners = [];
    var stateChangeListeners = [];
    var onBeforeMethodCall = [];
    var onAfterMethodCall = [];

    function component(config) {
        function makeInstance(params) {
            currentId += 1;
            var id = currentId;
            var stateListeners = [];
            var thisComponent = createRemoteObject("component");
            Components[id] = thisComponent;

            thisComponent.set("id", id);
            thisComponent.set("props", params || {});
            thisComponent.set("state", config.getInitialState.apply(thisComponent) || {});

            if (config.name === undefined) {
                throw new TypeError("Components are required to have a name. component({name: ...})");
            }
            thisComponent.set("name", config.name);

            var valueListeners = Object.keys(thisComponent.state).reduce(function(prev, key) {
                prev[key] = [];
                return prev;
            }, {});
            var transitionListeners = [];

            thisComponent.reset = function() {
                thisComponent.state = config.getInitialState.apply(thisComponent) || {};
            };

            thisComponent.delete = function() {
                // first let the listeners do their thing
                deletionListeners.forEach(function(fn) {
                    fn(thisComponent);
                });
                // then let the user defined delete function do its thing, if it is defined at all
                config.delete ? config.delete.apply(thisComponent, arguments) : null;

                // then, actually clean up the object
                thisComponent.remove();
                delete Components[id];
            };

            thisComponent.state.listen = function(name, fn) {
                // listen for a value change using point.state.listen("x", callback (newValue) {...});
                // or listen for any state changes using point.state.listen(callback (pointState) {})
                if (arguments.length === 2) valueListeners[name].push(fn);
                // name is the callback function passed in as the first argument
                else if (arguments.length === 1) stateListeners.push(name);
            };

            // this function is by far the most interesting idea I've ever had in programming I think
            thisComponent.state.listenForTransition = function(name, before, after, fn) {
                // this allows you to listen for state transitions.
                // for example, when a switch gets toggled on, at tick one, the switch will be off, switch.state = {active: false};
                // At the second tick, the switch will be on, switch.state = {active: true}
                // a transition listener can specify a before and after condition, for example: "active", {before: false, after: true}
                // it will then be called when this transition happens. Using this techique, it's extremely easy to generate "on" and "off" event listeners
                // for boolean states.
                if (arguments.length === 4) transitionListeners.push({
                    name: name,
                    before: before,
                    after: after,
                    fn: fn
                });
                else if (arguments.length === 1) transitionListeners.push({
                    fn: name
                });
                else if (arguments.length === 2) transitionListeners.push({
                    fn: before,
                    name: name
                })
            };

            thisComponent.state.alter = function(name, value) {
                // if the value is a function, execute that function over the value in the state.
                // otherwise, simply set the state to the passed value

                // basically, it allows you to do this:
                // alter("x", function (val) {return val + 5;}); // adds 5
                // or
                // alter("x", 5); // sets x to 5
                // or
                // alter({
                //   x: 5,
                //   y: 10
                // });
                function alter(name, value) {
                    var before = thisComponent.state[name];
                    var after = value;
                    var path = "state.{name}".format({
                        name: name
                    });

                    value = typeof value === "function" ? value(thisComponent.state[name]) : value;
                    thisComponent.set(path, value);
                    // thisComponent.state[name] = value;
                    notify(name, before, after);
                    stateChangeListeners.forEach(function(listener) {
                        listener(thisComponent, {
                            name: name,
                            before: before,
                            after: value
                        });
                    });
                }

                if (typeof name === "object") {
                    Object.keys(name).forEach(function(key) {
                        var v = name[key];
                        alter(key, v);
                    });
                } else {
                    alter(name, value);
                }
            };

            function notify(name, before, after) {
                try {
                    valueListeners[name].forEach(function(fn) {
                        fn(thisComponent.state[name]);
                    });
                } catch (e) {
                    //console.log(name);
                }
                // passes the whole state
                stateListeners.forEach(function(fn) {
                    fn(thisComponent.state);
                });

                transitionListeners.forEach(function(transitionListener) {
                    if (transitionListener.name === name) {
                        if (transitionListener.before === before && transitionListener.after === after) {
                            transitionListener.fn();
                        } else {
                            transitionListener.fn();
                        }
                    }
                });
            }

            Object.keys(config).forEach(function(key) {
                var value = config[key];
                if (key !== "delete") {
                    if (typeof value === "function") {
                        // each method needs to be wrapped in order to be able to add the onBefore and onAfter method call listener.
                        function wrap() {
                            var that = this;
                            var args = arguments;
                            var result;

                            onBeforeMethodCall.forEach(function(listener) {
                                listener(thisComponent, key, args);
                            });

                            result = value.apply(this, arguments);

                            onAfterMethodCall.forEach(function(listener) {
                                listener(thisComponent, key, args);
                            });

                            return result;
                        }
                        thisComponent[key] = wrap;
                    } else {
                        thisComponent[key] = value;
                    }
                }
            });

            creationListeners.forEach(function(listener) {
                listener(thisComponent, thisComponent.props);
            });

            config.onCreate ? config.onCreate.call(thisComponent) : null;

            return thisComponent;
        }

        makeInstance.extend = function(extendConfig) {
            var configCopy = extend({}, config);
            var onCreate = configCopy.onCreate || noop;
            var exOnCreate = extendConfig.onCreate || noop;
            var getInitialState = configCopy.getInitialState || noop;
            var exgetInitialState = extendConfig.getInitialState || noop;

            delete configCopy.getInitialState; // to prevent "overwriting getInitialState message from extend()"

            configCopy = extend(configCopy || {}, extendConfig);

            configCopy.getInitialState = function() {
                return extend(getInitialState.apply(this) || {}, exgetInitialState.apply(this) || {});
            };

            configCopy.onCreate = function() {
                onCreate.apply(this);
                exOnCreate.apply(this);
            };

            return component(configCopy);
        };

        makeInstance.name = config.name;
        makeInstance.config = config;
        Blueprints.push(makeInstance);

        return makeInstance;
    }

    component.all = Components;

    // Remove all instances of components, basically destroys your whole program.
    component.removeAll = function() {
        Object.keys(Components).forEach(function(key) {
            Components[key].delete();
        });

        currentId = 0;
    };

    // Be notified whenever an component get instantiated.
    component.listenForCreation = function(fn) {
        creationListeners.push(fn);
    };

    // Be notified whenever an object dies.
    component.listenForDeletion = function(fn) {
        deletionListeners.push(fn);
    };

    // allows to intercept ALL method calls on any component.
    // component.listenForMethodCall = function(fn) {
    //     methodCallListeners.push(fn);
    // };

    component.onBeforeMethodCall = function(fn) {
        onBeforeMethodCall.push(fn);
    };

    component.onAfterMethodCall = function(fn) {
        onAfterMethodCall.push(fn);
    };

    component.listenForStateChange = function(fn) {
        stateChangeListeners.push(fn);
    };

    return component;
}());

var gameLoop = (function() {
    var config = createRemoteObject("gameloop");
    config.set("framerate", 60);
    config.set("paused", false);

    var requestAnimationFrame = function(callback) {
        window.setTimeout(callback, 1000 / config.framerate);
    };

    return function(step) {
        function render() {
            if (!config.paused) {
                step();
                requestAnimationFrame(render);
            }
        }

        config.setFunction("step", step);
        // when the config.paused goes from true to false, start rendering again.
        config.onTransition("paused", true, false, render);

        render();
    };
}());

function renderLoop(onRender) {
    var paused = false;
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    function render() {
        if (!paused) {
            onRender();
            requestAnimationFrame(render);
        }
    }

    render();

    return function toggleRenderLoop() {
        paused = !paused;
    };
}

function compose() {
    var funcs = arguments;

    return function() {
        var args = arguments;
        var i;

        for (i = funcs.length; i-- > 0;) {
            args = [funcs[i].apply(this, args)];
        }

        return args[0];
    };
}

function calculateDelta(start, end, resolution) {
    "use strict";
    var difference = end - start;

    return difference / resolution;
}

function translate(value, leftMin, leftMax, rightMin, rightMax) {
    "use strict";
    var leftSpan = leftMax - leftMin;
    var rightSpan = rightMax - rightMin;
    var scaled = (value - leftMin) / leftSpan;

    return rightMin + scaled * rightSpan;
}

var createMouseDragEvent = function(target) {
    "use strict";

    var lastposition;
    var keys           = {};
    var listeners      = [];
    var endlisteners   = [];
    var startlisteners = [];
    target             = target || window;

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
        addListener.pos = lastposition;

        startlisteners.forEach(function (listener) {
            listener();
        });

        if (event.which === 1) keys.leftMouse = true;
        else if (event.which === 3) keys.rightMouse = true;
        else if (event.which === 2) keys.middleMouse = true;

    });

    target.addEventListener('touchstart', function(event) {
        lastposition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        addListener.pos = lastposition;

        startlisteners.forEach(function (listener) {
            listener();
        });

        keys.leftMouse = true;
    });

    window.addEventListener('touchend', function() {
        if (keys.leftMouse) {
            // a drag event was going on
            endlisteners.forEach(function (listener) {
                listener();
            });
        }

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
        if (keys.leftMouse || keys.rightMouse || keys.middleMouse) {
            // a drag event was going on
            endlisteners.forEach(function (listener) {
                listener();
            });
        }

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

    function addListener(listener, onstart, onend) {
        listeners.push(listener);
        onstart && startlisteners.push(onstart);
        onend   && endlisteners  .push(onend);
        listener.unListen = function() {
            listeners.splice(listeners.indexOf(listener), 1);
        };

        return listener;
    }

    addListener.keys = keys;
    addListener.pos = {
        x: 0,
        y: 0
    };

    return addListener;
};

var magicMousey;
magicMousey = createMouseDragEvent(window);

function fullscreenCanvas() {
    "use strict";
    var drawing = Object.create(null);
    var stylesheet = document.createElement("style");
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    function resize() {
        var width = window.innerWidth;
        var height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;
    }

    stylesheet.innerHTML = "* {margin: 0; padding: 0; overflow: hidden;}";

    resize();
    window.addEventListener("resize", resize);

    document.body.appendChild(stylesheet);
    document.body.appendChild(canvas);

    drawing.canvas = canvas;
    drawing.ctx = ctx;

    drawing.clear = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    drawing.disableContextMenu = function() {
        window.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            return false;
        });
    };

    return drawing;
}

function canvasWithSize(x, y) {
    "use strict";
    var drawing = Object.create(null);
    var stylesheet = document.createElement("style");
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = x;
        canvas.height = y;
    }

    stylesheet.innerHTML = "* {margin: 0; padding: 0; overflow: hidden;}";

    resize();
    window.addEventListener("resize", resize);

    document.body.appendChild(stylesheet);
    document.body.appendChild(canvas);

    drawing.canvas = canvas;
    drawing.ctx = ctx;

    return drawing;
}
