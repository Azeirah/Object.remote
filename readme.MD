# Object.remote

Object.remote sends JavaScript objects over a server to any remote clients, who are then able to visualize and even interact with these components. The remote clients are allowed to send back any changes to the original client.

Object.remote simply tries it best to make sure that objects on either side of the connection stay the same. This works very well.

This means is that you can use an object on two or more pages at the same time, cool huh?

## Demo-time, wooh!

Check out the examples for now. I don't have a remote server enabled yet.

## Applications

So, what's this for? Object.remote can be used for many things, I personally tried the following things, and I'm glad it's working well :)

1. Building remote controls for games
2. Finding just the right value for more complex behaviors, for example, for bezier curves animations, gravity for jumping, position on a page.
3. Debugging complex behavior
4. Plotting data over time
5. Real-time profiling and visualization.
6. Real-time manipulation of arbitrary objects (check out martijnbrekelmans.com/game with the remote.html in the example directory).

All in all, Object.remote has a wide use-case.

## How does it work?

Object.remote consists of three things

1. The client, this is a single page using the Object.remote JavaScript file
2. Any number of remote client pages, we'll call these remotes, these are pages that can receive the Objects created in the client, and then visualize, manage and interact with them.
3. The remote object server, this is a very simple websocket server that passes any messages it gets to all its connections, except to the one it received the message from

## And how do I get it running?

At the moment, because of how the server works, before you open the client, the remote pages need to be loaded and connected to the server. This implies the following load-order:

Start server -> load up any remote pages -> open client

Otherwise, you'll get errors on your remote.

## And how do I use it in my applications?

Conceptually, remote objects are the same as normal objects.

Unfortunately, because es6-proxies aren't supported in any browser but the newest Chrome, the syntax to set properties differs from normal objects.

```js
// Create an object
var circle = {
    x: 10,
    y: 10,
    radius: 50
};

// To create this same object, do the following

// This is needed to connect to the remote object server.
// The first argument is needed to bond the client to the server, this call is similar to cupido, shooting an arrow of love to bond the server with the client.
var client = remoteObject.client("ws://localhost:8080");

// This client variable can be called to create objects
var circle = client("shapes", {
    x: 10,
    y: 10,
    radius: 50
});

// analogous to circle.radius = 25;
circle.set("radius", 25);

// There's also a deletion operator, if you need to care about memory. It's best practice, but not necessary, to use it.
circle.remove();
```

The "shapes" argument is a namespace, this is to differentiate between different types of objects, so the remote can use different visualizations for different types of objects.

It's important to know, that the server functions are **not** sent over the wire. Remote objects are **data only**.

##### Todo

At the moment, some functions don't "just work". For example, a remote cannot be connected to multiple clients. Also, it's important that the remote gets connected to the server before the client does, I'd like to resolve this in the future also.

Most importantly however, I need to get some great examples up and running.
