
var PORT = 40011;
var HOST = '224.224.24.1';
var WLAN = '169.254.151.98';
var LOCAL = '192.168.1.46';

var dgram = require('dgram');
var client = dgram.createSocket('udp4');

client.on('listening', function () {
    var address = client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
   client.setBroadcast(true)
   client.setMulticastTTL(128); 
   client.addMembership(HOST, LOCAL);
});

client.on('message', function (message, remote) {   
//    console.log('A: Epic Command Received. Preparing Relay.');
//    console.log('B: From: ' + remote.address + ':' + remote.port +' - ' + message);
console.log('message', message);

});

client.bind(PORT);