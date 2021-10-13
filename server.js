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

const COMMANDS = {
  CLIENT_CONNECTED_ACK: "CLIENT_CONNECTED_ACK",
  CONNECTED: "CONNECTED",
  CREATE_GAME: "CREATE_GAME",
  GAME_CREATED: "GAME_CREATED",
  GAME_JOINED: "GAME_JOINED",
  GAME_MATCH_FOUND: "GAME_MATCH_FOUND",
};

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
  const gameInfo = { gameId, players: [clientId], started: false };
  currentGames.push(gameInfo);
  return gameInfo;
};

const sendCommands = (command = "", recievingClients = [], payload = {}) => {
  websocketServer.clients.forEach((client) => {
    const { clientId } = client;
    if (recievingClients.includes(clientId)) {
      console.log(`sending ${command} to ${clientId}`);
      client.send(JSON.stringify({ command, ...payload }));
    }
  });
};

const saveClient = (clientId) => {
  if (!clientId) {
    console.error("-- Recieved client ACK with no clientId --");
  } else {
    console.log("Adding client to client list");
    clientIdMap.push({ clientId });
  }
};

const handleCommand = (parsedPayload) => {
  const { clientId, command = "" } = parsedPayload;

  if (command === COMMANDS.CLIENT_CONNECTED_ACK) {
    saveClient(clientId);
  }

  if (command === COMMANDS.CREATE_GAME) {
    const gameInfo = setupGame(clientId);
    sendCommands(COMMANDS.GAME_CREATED, [clientId], gameInfo);
  }

  if (command === COMMANDS.GAME_JOINED) {
    currentGames.forEach((game) => {
      if (parsedPayload.params.gameId === game.gameId) {
        console.log("game exists");
        console.log(game);

        if (game.players.includes(clientId)) {
          console.log("player already in game");
        } else {
          if (!game.started) {
            game.players.push(clientId);
            console.log("New player joined. Matching players");
            sendCommands(COMMANDS.GAME_MATCH_FOUND, game.players);
            game.started = true;
          }
        }
      }
    });
  }
};

//when a websocket connection is established
websocketServer.on("connection", (webSocketClient, req) => {
  const newClientId = generateClientId();
  webSocketClient.clientId = newClientId;
  console.log("\n\nGot a connection. Sending client it's details...\n");

  try {
    const payload = JSON.stringify({
      command: COMMANDS.CONNECTED,
      clientId: newClientId,
    });
    webSocketClient.send(payload);
  } catch (e) {
    console.error(e);
  }

  //when a message is received
  webSocketClient.on("message", (payload = {}) => {
    console.log("recieved message:");

    try {
      const parsedPayload = JSON.parse(payload);
      console.log(parsedPayload);

      if (parsedPayload) {
        handleCommand(parsedPayload);
      }
    } catch (e) {
      console.error(e);
    }
  });
});

//start the web server
server.listen(serverPort, () => {
  console.log(`Websocket server started on port ` + serverPort);
});
