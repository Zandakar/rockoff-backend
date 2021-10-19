"use strict";

//  https://www.giacomovacca.com/2015/02/websockets-over-nodejs-from-plain-to.html
//  https:stackoverflow.com/questions/31338927/how-to-create-securetls-ssl-websocket-server/36212597

const fs = require("fs");
const https = require("http");
var WebSocketServer = require("ws").Server;

var privateKey = fs.readFileSync(
  "/home/ubuntu/rockoff-backend-certs/key.pem",
  "utf8"
);
var certificate = fs.readFileSync(
  "/home/ubuntu/rockoff-backend-certs/cert.pem",
  "utf8"
);

var credentials = { key: privateKey, cert: certificate };
var express = require("express");
var app = express();

//... bunch of other express stuff here ...

//pass in your express app and credentials to create an https server
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8000);

var websocketServer = new WebSocketServer({
  server: httpsServer,
});

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

const sendCommands = (command = "", recievingClients = [], params = {}) => {
  websocketServer.clients.forEach((client) => {
    const { clientId } = client;
    if (recievingClients.includes(clientId)) {
      console.log(`sending ${command} to ${clientId}`);
      client.send(JSON.stringify({ command, params: params }));
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
        if (game.players.includes(clientId)) {
          console.log("player already in game");
        } else {
          if (!game.started) {
            game.players.push(clientId);
            console.log("New player joined. Matching players");
            game.started = true;
            sendCommands(COMMANDS.GAME_MATCH_FOUND, game.players, game);
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
