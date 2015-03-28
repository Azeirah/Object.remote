# Object.remote

Object.remote sends JavaScript objects over a server to any remote clients, who are then able to visualize and even interact with these components. The remote clients are allowed to send back any changes to the original client.

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
3. The remote object server, this is a very simple websocket server that 

## And how do I get it running?

At the moment, because of how the server works, before you open the client, the remote pages need to be loaded and connected to the server. This implies the following load-order:

Start server -> load up any remote pages -> open client

Otherwise, you'll get errors on your remote.

## And how do I use it in my applications?

Remote objects are nothing but mere Objects.

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

// Unfortunately, because es6-proxies aren't supported in any browser but the newest Chrome, we need to use functions to set Object properties.

// analogous to circle.radius = 25;
circle.set("radius", 25);

// There's also a deletion operator, if you need to care about memory. It's best practice, but not necessary, to use it.
circle.remove();
```

The "shapes" argument is a namespace, this is to differentiate between different types of objects, so the remote can use different visualizations for different types of objects.

It's important to know, that the server functions **are** not sent over the wire. Remote objects are **data only**.