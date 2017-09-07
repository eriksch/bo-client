const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const filewatcher = require('filewatcher');
const fs = require('fs');
const dgram = require('dgram');
const eachSeries = require('async/eachSeries');
const each = require('lodash/each');
const filter = require('lodash/filter');

const app = express();

// Path to watch for changes
const DEMO_WATCH_PATH = 'data/request.txt';
const PROD_WATCH_PATH = '/home/pi/uapi/Products/uapi/server/nuance.txt';
const WATCH_PATH = process.env.npm_lifecycle_event === 'demo' ? DEMO_WATCH_PATH : PROD_WATCH_PATH;

// Setting for reading audio stream start and end messages
const MULTICAST_ADDRESS = '224.224.24.1';
const MULTICAST_PORT = 40011;

// UserVoiceCommandWatcher
function UserVoiceCommandWatcher(ws) {
  const watcher = filewatcher();
  const socket = dgram.createSocket('udp4');

  socket.on('listening', () => {
    var address = socket.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
    socket.setBroadcast(true)
    socket.setMulticastTTL(128);
    each(findAdapters(), (adapter) => {
      try {
        socket.addMembership(MULTICAST_ADDRESS, adapter.address);
      } catch(err) {}
    });
  });

  socket.on('message', (message) => {
    if (message.length < 27) return false;

    let foundStart = (msg) => {
      if (msg.length < 27) return false;
      return (msg[26] == 0x36 && msg[27] == 0x41)
    }

    let foundEnd = (msg) => {
      if (msg.length < 27) return false;
      return (msg[26] == 0x36 && msg[27] == 0x43)
    }

    if (foundStart(message)) {
      console.log('found start');
	    ws.send(JSON.stringify('ON_AUDIO_START'));
    }

    if (foundEnd(message)) {
	    console.log('found end');
      ws.send(JSON.stringify('ON_AUDIO_END'));
    }
  });

  // bind to multicast address
  socket.bind(MULTICAST_PORT);

  // watch the user voice request
  watcher.add(WATCH_PATH);

  // and act when this file changes
  watcher.on('change', (file, stat) => {
    ws.send(JSON.stringify(readRequest()));
  });

  // Return stop method to do cleanup
  return {
    stop: () => {
      watcher.removeAll();
      socket.close();
    }
  }
}

// read request from file
function readRequest() {

  // read contents
  let contents = fs.readFileSync(WATCH_PATH, {encoding: 'utf-8'});
  if (!contents) return "";

  // split on newlines
  let lines = contents.split("\n");

  // return first lines else just return string;
  if (lines instanceof Array && lines.length > 0) {
    return lines[0];
  } else {
    return lines;
  }
}

// serve assets from public folder
app.use(express.static('public'));

// serve the main index file
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// listen for http requests :)
var listener = app.listen(8000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// Create new websocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const location = url.parse(req.url, true);

  // listen from user commands
  const userVoiceCommandWatcher = UserVoiceCommandWatcher(ws);

  // hold interval id
  let demo = 0;

  if (process.env.npm_lifecycle_event === 'demo') {
    demo = randomRequest();
  }

  // Handle incomming messages
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });

  // handle close event, cleanup watcher
  ws.on('close', () => {
    userVoiceCommandWatcher.stop();
    delete userVoiceCommandWatcher;

    if (process.env.npm_lifecycle_event === 'demo') {
      clearInterval(demo);
    }
  });
});

// listen on websocket
server.listen(8001, () => {
  console.log('Listening on %d', server.address().port);
});

/// Find adapters
function findAdapters() {
  let adapters = [];
  each(require('os').networkInterfaces(), (value, name) => {
    let iface = filter(value, (item) => item.internal == false && item.family == 'IPv4')
    if (iface.length) adapters.push(iface);
  });
  return adapters;
}

/// DEBUG stuff
const questions = [
  "Who are you?",
  "how are you doing?",
  "how can I change the channel?",
  "i want to see an action movie",
  "can you recommend an Adventure movie?",
];

function randomRequest() {

  const messages = [
    Buffer.from('17:45:53.299$6A>'),
    Buffer.from('17:45:53.309$6B>'),
    Buffer.from(' 17:45:53.330$6I"'),
    Buffer.from('17:45:58.298$o6C')
  ];

  const server = dgram.createSocket('udp4');

  server.bind(MULTICAST_PORT, () => {
    server.setBroadcast(true);
    server.setMulticastTTL(128);
    server.addMembership(MULTICAST_ADDRESS);
  });

  return setInterval(() => {

    eachSeries(messages,  (message, done) => {
      server.send(message, MULTICAST_PORT, MULTICAST_ADDRESS, (err) => {
        //console.log(err);
      });

      setTimeout(() => {
        done();
      }, 1000);

    }, (err) => {
      fs.writeFileSync(WATCH_PATH, questions[Math.floor(Math.random() * 6)]);
    });

  }, 8000);
}



