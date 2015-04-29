#!/usr/bin/env node
var port            = process.argv[2] || 8080;
var WebSocketServer = require('ws').Server;
var wss             = new WebSocketServer({port: port});
var clients         = {};

// in order to allow remotes at any point
// we need to save a history of received commands from the client.
// Then, whenever a new remote connects, we can send the history in one go
// so it will be synced again
//
// The server needs to be able to differentiate between clients and remotes.
// We'll assume no more than one client for now.
/*
var theClient = undefined;
var remotes = [];

onConnect (connection): if   (isclient) theClient = connection;
                        else            remotes.push(connection);
 */

var theClient = {
    channel: undefined,
    history: []
};
var remotes   = [];

var generateUniqueId = (function () {
    var currentId = 0;
    return function () {
        var id    = currentId;
        currentId += 1;

        return id;
    }
}());

function assert (condition, message) {
    var errorMessage = message? "Assertion error: " + message : "Assertion error.";
    if (!condition) {
        throw new Error(errorMessage);
    }
}

console.log("Started up a remote object server @port " + port + ".");

function isChannelClient(ch) {
    return theClient && theClient.channel === ch;
}

function broadcast (message, ch) {
    wss.clients.forEach(function (client) {
        if (ch !== client) {
            client.send(message);
        }
    });
}

function synchroniseRemote (history, remoteChannel) {
    console.log("synchronising remote");
    history.forEach(function (message) {
        remoteChannel.send(message);
    });
}

function handleNewConnection (message, ch) {
    assert(message.type === "on connection", "Shouldn't handle non 'on connection' messages");
    if (message.value === "client") {
        console.log("A new client has connected");
        if (theClient.channel !== undefined) {
            console.log("The server doesn't support multiple clients yet, open only one client and restart the server");
        }
        theClient = {
            channel: ch,
            history: []
        };
    } else if (message.value === "remote") {
        console.log("A new remote has connected");
        remotes[generateUniqueId()] = ch;
        if (theClient.channel !== undefined) {
            synchroniseRemote(theClient.history, ch);
        }
    }
}

wss.on("connection", function (ch) {
    ch.on("message", function (message) {
        var decodedMessage = JSON.parse(message);

        if (decodedMessage.type === "on connection") {
            handleNewConnection(decodedMessage, ch);
        } else {
            if (isChannelClient(ch)) {
                // keep a history of all messages sent by the client
                // so remotes can be synchronised
                theClient.history.push(message);
            }

            broadcast(message, ch);
        }
    });

    ch.on("close", function () {
        if (isChannelClient(ch)) {
            // when the client disconnects, "theClient" can be cleaned up
            console.log("client disconnected");
            theClient = {
                channel: undefined,
                history: []
            };
        } else {
            // nothing needs to happen when a remote disconnects.
            console.log("remote disconnected");
        }
    });
});
