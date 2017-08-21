const host = window.document.location.host.replace(/:.*/, '');
const accessToken = '5199210cf8e04a95813e66efe9c59693';
const client = new ApiAi.ApiAiClient({accessToken: accessToken});
const baseUrl = 'https://api.api.ai/v1/';
const messageSorry = "I'm sorry, I don't have the answer to that yet.";
const session = Math.random();

console.log('host', host, 'baseUrl', baseUrl, 'accessToken', accessToken);

var ws = new WebSocket('ws://' + host + ':8080');

ws.onerror = () => showDebug('WebSocket error');
ws.onopen = () => showDebug('WebSocket connection established');
ws.onclose = () => showDebug('WebSocket connection closed');
ws.onmessage = (event) => handleMessage(JSON.parse(event.data));

$(window).on('keydown', function(event) {
  let msg = '';
  switch (event.keyCode) {
    case 50:
        msg = 'can you recommend me an Action movie?';
      break;
    case 51:
      msg = 'can you show me the poster?';
    break;
    case 52:
      msg = 'whats it about?';
      break;
case 53:
	msg = 'yes';
break;
case 54:
	msg = 'no';
break;
    default:
      return;
  }

  addQuestion(msg)
  send(msg);

});

function showDebug(msg) {
    console.log(msg);
}

function handleMessage(message) {
  switch(message) {
    case 'ON_AUDIO_START':
      $('.sk-folding-cube').show();
   	setTimeout(function() {
		$('.sk-folding-cube').hide();
	}, 9000); 
   break;
    case 'ON_AUDIO_END':
      setTimeout(function() {
      	$('.sk-folding-cube').hide();
	}, 3000);
    break;
    default:
      showMessage(message);
    break;
  }
}

function showMessage(msg) {
    addQuestion(msg);
    send(msg);
   
}

function send(msg) {
  client.textRequest(msg)
    .then(function(data) {
      prepareResponse(data);
    })
    .catch(function() {
      respond("Connection could not be established");
    });
}

function prepareResponse(data) {
  var debugJSON = JSON.stringify(data, undefined, 2),
    spokenResponse = data.result.speech;

  if (data.result.fulfillment.messages) {
    data.result.fulfillment.messages.forEach(function(message) {
      if (message.type === 4) {
        respondWithImage(message.payload.poster_path);
        return;
      }
    })
  }

  if (data.result.fulfillment) {
    spokenResponse = data.result.fulfillment.speech;
    respond(spokenResponse);
  }


}

function respondWithImage(path) {
  $('#messages').prepend('<cf-chat-response class="robot peak-thumb show animated fadeIn"><thumb></thumb><p class="show"><img src="http://image.tmdb.org/t/p/w154/' + path +'" /></p></cf-chat-response>');
}

function respond(val) {
  if (val == "") {
    val = messageSorry;
  }

  //if (indexOf('http://') )

  $('#messages').prepend('<cf-chat-response class="robot peak-thumb show animated fadeIn"><thumb></thumb><text><p class="show">' + val +'</p></text></cf-chat-response>');

  var msg = new SpeechSynthesisUtterance();
  msg.voiceURI = "native";
  msg.text = val;
  msg.lang = "en-US";
  window.speechSynthesis.speak(msg);
}

function addQuestion(msg) {
  $('#messages').prepend('<cf-chat-response class="user show peak-thumb animated fadeIn"><thumb></thumb><text><p class="show">' + msg + '</p></text></cf-chat-response>');
}
