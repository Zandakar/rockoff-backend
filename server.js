"use strict";

const serverPort = 8000,
  http = require("http"),
  express = require("express"),
  app = express(),
  server = http.createServer(app),
  WebSocket = require("ws"),
  websocketServer = new WebSocket.Server({ server });

const clientIdMap = [];
const currentGames = [];

const generateId = () => {
  // Example: 8294-f28e-a31c
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + "-" + s4() + "-" + s4();
};

const generateClientId = () => "client" + "-" + generateId();

const setupGame = (clientId) => {
  console.log("setupGame");

  const gameId = generateId();

  const gameInfo = { gameId, players: [clientId] };
  currentGames.push(gameInfo);
  return gameInfo;
};

const sendMessage = (command = "", recievingClients = [], payload = {}) => {
  console.log("sendMessage");
  console.log(recievingClients);
  // console.log(`---------- websocketServer.clients ----------`);
  // console.log(websocketServer.clients);

  websocketServer.clients.forEach((client) => {
    const { clientId } = client;
    console.log(clientId);
    if (recievingClients.includes(clientId)) {
      console.log("sending message to:", clientId);
      client.send(JSON.stringify({ command, ...payload }));
    }
  });
};

const saveClient = (clientId) => {
  console.log("saveClient");
  clientIdMap.push({ clientId });
};

//when a websocket connection is established
websocketServer.on("connection", (webSocketClient, req) => {
  const newClientId = generateClientId();
  webSocketClient.clientId = newClientId;
  console.log("Got a connection");

  try {
    const payload = JSON.stringify({ connection: "ok", clientId: newClientId });
    webSocketClient.send(payload);
  } catch (e) {
    console.error(e);
  }

  //when a message is received
  webSocketClient.on("message", (payload) => {
    console.log("recieved message");

    try {
      const parsedPayload = JSON.parse(payload);
      console.log(parsedPayload);

      if (parsedPayload) {
        const { clientId, command = "" } = parsedPayload;

        if (command === "CLIENT_ACK") {
          saveClient(clientId);
        }

        if (command === "INVITE") {
          const gameInfo = setupGame(clientId);
          sendMessage("GAME_CREATED", [clientId], gameInfo);
        }
      }

      // returnedMessage = `${parsedMessage.displayName} says: ${parsedMessage.message}`;
    } catch (e) {
      console.error(e);
    }

    // websocketServer.clients.forEach((client) => {
    //   client.send(JSON.stringify({ message: returnedMessage }));
    // });
  });
});

//start the web server
server.listen(serverPort, () => {
  console.log(`Websocket server started on port ` + serverPort);
});
