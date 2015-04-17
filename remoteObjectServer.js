var port            = 8080;
var WebSocketServer = require('ws').Server;
var wss             = new WebSocketServer({port: port});
var clients         = {};

console.log("starting up a remote object server @port " + port + ".");

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
