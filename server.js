"use strict";

//  https://www.giacomovacca.com/2015/02/websockets-over-nodejs-from-plain-to.html
//  https:stackoverflow.com/questions/31338927/how-to-create-securetls-ssl-websocket-server/36212597

const fs = require("fs");
const https = require("http");
var WebSocketServer = require("ws").Server;

const bla = () => {
  return 2;
};

export { bla };
