"use strict";

const serverPort = 8000,
  http = require("http"),
  express = require("express"),
  app = express(),
  server = http.createServer(app),
  WebSocket = require("ws"),
  websocketServer = new WebSocket.Server({ server });

websocketServer.getUniqueID = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4();
};

//when a websocket connection is established
websocketServer.on("connection", (webSocketClient, req) => {
  webSocketClient.id = websocketServer.getUniqueID();
  //send feedback to the incoming connection
  console.log("Got a connection");

  webSocketClient.send(JSON.stringify({ connection: "ok" }));

  //when a message is received
  webSocketClient.on("message", (message) => {
    console.log("recieved message: ", message);
    //for each websocket client
    websocketServer.clients.forEach((client) => {
      console.log("Client.ID: " + client.id);

      //send the client the current message
      client.send(JSON.stringify({ message: message }));
    });
  });
});

//start the web server
server.listen(serverPort, () => {
  console.log(`Websocket server started on port ` + serverPort);
});
