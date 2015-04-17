# Developer documentation

1. Passing messages

## Passing messages

The client, server and remote communicate with each other through a simple protocol. There are five different types of messages that can be sent, each message signifies a kind of action that should be taken on either the client or the remote.

1. new object
2. deleted object
3. updated object
4. set function
5. invoke function

There's also the new connection message, when a client or remote connects, this message will be sent.

Each message takes at least these two parameters in object format.
These are:
```
{
    type: String, // one of the five abovementioned messages
    id: Number
}
```
In all upcoming message formats, the fixed parameters are left out for brevity.

### new object

```
{
    type: "new object"
}
```
This message does the same on the client as on any remote. It creates an empty object in the private "objectContainer" variable.

```
objectContainer[id] = Object.create(null);
```
### deleted object

```
{
    type: "deleted object"
}
```
This message does the same on the client as on any remote. It removes the reference to the object in the private "objectContainer" variable.

```
delete objectContainer[id];
```
### updated object

```
{
    type: "updated object",
    key: "numberOfBooks",
    value: 15
}
```

This message does the same on the client as on any remote. It sets the object's key to value.

```
objectContainer[id][key] = value;
```

### set function

```
{
    type: "add function",
    name: "print",
}
```

This message differs on the client from the remote. On the client, it sets a reference to the passed function on the object, similarly to "updated object". Because of the nature of remote clients, them not being exact copies of the client, instead of setting a function reference, it sets the value to "remote function".

So on the client
```
objectContainer[id][functionName] = function functionName () {...}
```
While on the remote
```
objectContainer[id][functionName] = "remote function"
```

### invoke function

```
{
    type: "invoke function",
    name: "name of function"
}
```

This message also differs on the client from the remote. On the client, it simply invokes the function at the location "name". While on the remote, it sends a message to the client, so it can invoke itself.

On the client
```
objectContainer[id][functionName]();
```
On the remote
```
sendMessage(invokeFunction...);
```

### on connection

```
    type: "connection",
    value: "client" | "server"
```

This message will be sent on initial connection. It will not be passed to any other clients, it's for the server only.
