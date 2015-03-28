var WebSocketServer = require('ws').Server;
var wss             = new WebSocketServer({port: 8080});

var clients = {};

function decodeMessage (message) {
    return JSON.parse(message);
}

function sendJSON (client, message) {
    var data = JSON.stringify(message);
    client.send(data);
}

function broadcast (message, ch) {
    console.log("broadcasting", message);

    wss.clients.forEach(function (client) {
        if (ch !== client) {
            client.send(message);
        }
    });
}

wss.on("connection", function (ch) {
    console.log("A new client has connected!");

    ch.on("message", function (message) {
        broadcast(message, ch);
    });
});
