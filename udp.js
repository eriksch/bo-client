const each = require('lodash/each');
const filter = require('lodash/filter');
const dgram = require('dgram');
const PORT = 40011;
const HOST = '224.224.24.1';
const client = dgram.createSocket('udp4');

client.on('listening', function () {
    var address = client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
   client.setBroadcast(true)
   client.setMulticastTTL(128);

   each(findAdapters(), (adapter) => {
     try {
      client.addMembership(HOST, adapter.address);
     } catch(err) {}
   });
});

client.on('message', function (message, remote) {
  console.log('message', message);
});

client.bind(PORT);

function findAdapters() {
  let adapters = [];
  each(require('os').networkInterfaces(), (value, name) => {
    let iface = filter(value, (item) => item.internal == false && item.family == 'IPv4')
    if (iface.length) adapters.push(iface);
  });
  return adapters;
}
