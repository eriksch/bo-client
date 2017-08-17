const host = window.document.location.host.replace(/:.*/, '');
const accessToken = '5199210cf8e04a95813e66efe9c59693';
const baseUrl = 'https://api.api.ai/v1/';
const messageSorry = "I'm sorry, I don't have the answer to that yet.";

console.log('host', host, 'baseUrl', baseUrl, 'accessToken', accessToken);

var ws = new WebSocket('ws://' + host + ':8080');

ws.onerror = () => showDebug('WebSocket error');
ws.onopen = () => showDebug('WebSocket connection established');
ws.onclose = () => showDebug('WebSocket connection closed');
ws.onmessage = (event) => showMessage(JSON.parse(event.data));

function showDebug(msg) {
    console.log(msg);
}

function showMessage(msg) {
    addQuestion(msg);
    window.setTimeout(function() {
        send(msg);
    }, 1000);
}

function send(msg) {
    
    $.ajax({
      type: "POST",
      url: baseUrl + "query",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      headers: {
        "Authorization": "Bearer " + accessToken
      },
      data: JSON.stringify({query: msg, lang: "en", sessionId: "bo-client"}),

      success: function(data) {
        prepareResponse(data);
      },
      error: function() {
        respond("Connection could not be established");
      }
    });
  }

  function prepareResponse(val) {
    var debugJSON = JSON.stringify(val, undefined, 2),
      spokenResponse = val.result.speech;

    respond(spokenResponse);
  }

  function respond(val) {
    if (val == "") {
      val = messageSorry;
    }
 
    $('#messages').prepend('<li class="response animated fadeInDown">' + val + '</li>');
    
    var msg = new SpeechSynthesisUtterance();
    msg.voiceURI = "native";
    msg.text = val;
    msg.lang = "en-US";
    window.speechSynthesis.speak(msg);
  }

  function addQuestion(msg) {
    $('#messages').prepend('<li class="question animated fadeInDown">' + msg + '</li>');
  }
