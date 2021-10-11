"use strict";

const serverPort = 8000,
  http = require("http"),
  express = require("express"),
  app = express(),
  server = http.createServer(app),
  WebSocket = require("ws"),
  websocketServer = new WebSocket.Server({ server });

//when a websocket connection is established
websocketServer.on("connection", (webSocketClient) => {
  //send feedback to the incoming connection
  console.log("Got a connection");

  webSocketClient.send(JSON.stringify({ connection: "ok" }));

  //when a message is received
  webSocketClient.on("message", (message) => {
    console.log("recieved message: ", message);
    //for each websocket client
    websocketServer.clients.forEach((client) => {
      //send the client the current message
      client.send(JSON.stringify({ message: message }));
    });
  });
});

//start the web server
server.listen(serverPort, () => {
  console.log(`Websocket server started on port ` + serverPort);
});
