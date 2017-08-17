const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const filewatcher = require('filewatcher');
const fs = require('fs');

const app = express();

// Path to watch for changes 
const DEMO_WATCH_PATH = 'data/request.txt';
const PROD_WATCH_PATH = 'speech.txt';
const WATCH_PATH = process.env.npm_lifecycle_event === 'demo' ? DEMO_WATCH_PATH : PROD_WATCH_PATH;

// UserVoiceCommandWatcher
function UserVoiceCommandWatcher(ws) {
  const watcher = filewatcher();

  // read reqest from file
  readRequest = () => {

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
    }
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

  // Handle incomming messages
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });

  // handle close event, cleanup watcher
  ws.on('close', () => {
    userVoiceCommandWatcher.stop();
    delete userVoiceCommandWatcher;
  });
});

// listen on websocket
server.listen(8080, () => {
  console.log('Listening on %d', server.address().port);
});

/// DEBUG stuff
const questions = [
  "Who are you?",
  "How are you doing?",
  "How can I change the channel?"
];

function randomRequest() {
  setInterval(() => {  
      fs.writeFileSync(WATCH_PATH, questions[Math.floor(Math.random() * 3)]);
  }, 5000);
}

if (process.env.npm_lifecycle_event === 'demo') {
  randomRequest();
}

