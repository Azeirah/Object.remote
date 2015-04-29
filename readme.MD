# remoteObject

Normally, an object exists only on one webpage. remoteObject allows you to clone these objects onto other webpages. Manipulating them on one page, manipulates the same one on another. This is a very powerful but simple abstraction over websockets and objects. It allows for very interesting things in the fields of run-time program visualization, easily building of remote control pages for UI's and games, debugging, and more!

A primary example of what this library allows you to do can be found in remotes/basic/remote.html, refer to the quick-start guide below to use it yourself. It's an interface that allows to edit objects similarly to browser developer tools, *however*, it's completely unobtrusive by being on a remote webpage.

![Image of the demo running][demo]

## What problems does remoteObject solve?

remoteObject is developed to solve some problems:

1. Sometimes, you need to quickly prototype an interface, but you don't want to clutter whatever's already there. You can use this to build a remote interface, which will work equally well
2. While DAT.gui is useful, it quickly becomes too large and annoying to work with when a program gets past the toy phase.
3. Developer tools are nice to work with but they lack a bigger overview of "what objects exist" and "how do they behave".

## How does remoteObject solve these problems?

1. Because objects are remote by default, you can build an interface using any library you want to use. Instead of cluttering your application, it runs on a separate webpage, so your original interface remains unchanged.
2. There is a general-purpose interface available with functionality similar to DAT.gui. Instead of running in a small dropdown at the top-right of your window, it runs as a standalone fullscreen webpage.
3. The general-purpose interface was built around utilizing the screen space of a whole page, instead of being limited to being a part of your webpage as the console is.

## Quick-start guide

Remote objects require a server and at least two connected webpages.

First, install the server's required package, ws

```bash
$ npm install
```

Then, start the server.

```bash
$ node remoteObjectServer 8080
Started up a remote object server @port 8080.
```

### *I want to use this in my project!*

If you want to build your own remote JavaScript control ui's, or want to try out the automatic object visualizer for your own project,
check out the within the clients and remotes directories. You can also refer to the client and remote api down below.

#### or...
### *Just show me a demo already*

Open /basic/remote.html in any browser, and follow the instructions provided there.

## Examples

Check out the examples for now. I don't have a remote server enabled yet..

## Applications

So, what's this for? remoteObject can be used for many things, here are some examples. It's really a matter of creativity.

1. Building a remote UI for games, ever wanted to build a game that could be controlled simultaneously by the mouse and touch on the smartphone? Easy!
2. It allows for building remote interfaces to edit pieces of code that aren't best edited in text. Imagine a bezier curve editor at run-time, so you can really feel your way into getting the right animation.
3. It can be used as a fairly general purpose abstraction over websockets
4. Plotting data over time
5. Real-time profiling and visualization.
6. Real-time manipulation of arbitrary objects (check out martijnbrekelmans.com/game with the remote.html in the example directory).

All in all, remoteObject has a wide use-case.

## How does it work?

remoteObject consists of three things

1. The client, this is a single page using the remoteObject JavaScript file
2. Any number of remote client pages, we'll call these remotes, these are pages that can receive the Objects created in the client, and then visualize, manage and interact with them.
3. The remote object server, this is a very simple websocket server that passes any messages it gets to all its connections, except to the one it received the message from

## And how do I get it running?

At the moment, because of how the server works, before you open the client, the remote pages need to be loaded and connected to the server. This implies the following load-order:

Start server -> load up any remote pages -> open client

Otherwise, you'll get errors on your remote.

## Client api

Conceptually, remote objects are the same as normal objects.

Unfortunately, because es6-proxies aren't supported in any browser but the newest Chrome, the syntax to set properties differs from normal objects. If I could, I would use:
```js
circle.x = 20;
// instead of
circle.set("x", 20);
```

Client api:

```js
var remoteObjectServer = "ws://localhost:8080";
var remote = remoteObject.client(remoteObjectServer);

var circle = remote({
    x: 10,
    y: 10,
    radius: 50
});

circle.set("x", 15);
circle.set("y", 20);

circle.x; // 15
circle.y; // 20

// you can set functions on objects. On the remote, a function can be called
circle.setFunction("move", function (x, y) {
    circle.set("x", x);
    circle.set("y", y);
});

// On the remote call it like this
circle.invokeFunction("move", [20, 50]);
// Functions do not run on the remote, just pretend you're calling circle.move() on the client.

// if you do not want to broadcast an update for whatever reason, pass a third parameter to set
circle.set("x", 20, false);

// and last and very much least, you can destroy objects
circle.remove();
```

## Remote api

```js
var remoteObjectServer = "ws://localhost:8080";
var remote = remoteObject.remote(remoteObjectServer);

// functions that take care of the interface.
function newPoint(object, id) {
    ...
}

function onPointUpdate(object, id, newValue) {
    ...
}

function onPointDeletion(object, id) {
    ...
}

remote.listenForCreation(function (object, id) {
    console.log("new object received!");
    // note, listenForCreation only receives empty objects, the properties of the object get set immediately after this call
    // This will be resolved in a later update, when I find a decent solution to duck-typing objects without parameters
    // right now, you'll have to hack together something yourself like waitForReady defined in remotes/basic/js/remote.js
    waitForReady(object, ["x", "y"], function () {
      // object is ready
      newPoint(object, id);
      object.onUpdate(onPointUpdate);
      object.onDelete(onPointDeletion);
    });
});
```


[demo]: RemoteExample.png
