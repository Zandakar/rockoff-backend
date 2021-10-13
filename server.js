"use strict";

const serverPort = 8000,
  http = require("http"),
  express = require("express"),
  app = express(),
  server = http.createServer(app),
  WebSocket = require("ws"),
  websocketServer = new WebSocket.Server({ server });

websocketServer.generateClientId = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return "client" + "-" + s4() + "-" + s4() + "-" + s4();
};

//when a websocket connection is established
websocketServer.on("connection", (webSocketClient, req) => {
  const clientId = websocketServer.generateClientId();
  webSocketClient.id = clientId;
  console.log("Got a connection");

  try {
    const payload = JSON.stringify({ connection: "ok", clientId });
    webSocketClient.send(payload);
  } catch (e) {
    console.error(e);
  }

  //when a message is received
  webSocketClient.on("message", (payload) => {
    console.log("recieved message");

    let returnedMessage = "";
    try {
      const parsedMessage = JSON.parse(payload);
      console.log(parsedMessage);
      console.log(typeof parsedMessage.message);

      if (parsedMessage.message) {
        const { command = "" } = parsedMessage.message;
        console.log("parsedMessage.command");
        if (command === "INVITE") {
          console.log("Generating invite link");
        }
      }

      // returnedMessage = `${parsedMessage.displayName} says: ${parsedMessage.message}`;
    } catch (e) {
      console.error(e);
    }

    websocketServer.clients.forEach((client) => {
      client.send(JSON.stringify({ message: returnedMessage }));
    });
  });
});

//start the web server
server.listen(serverPort, () => {
  console.log(`Websocket server started on port ` + serverPort);
});
