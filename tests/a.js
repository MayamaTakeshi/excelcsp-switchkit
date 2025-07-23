const {SKProxyClient, SwitchKit}  = require('../index')

const args = {
    proxy_host: '192.168.2.101',
    proxy_port: 1313,
    app_name: 'test',
    app_version: '1.0.0',
    app_description: 'test',
    instance_id: 1234,
    host: '192.168.33.3',
    port: 1312,
}

const client = new SKProxyClient(args);

client.on('msg', msg => {
    console.log('Application: Received:')
    console.log(msg)
    if(msg.event == 'skj_initialize_ok') {
        let pingLLC = {
             _sk_func_: 'sendMsg',
             tag: SwitchKit.Tag.PingLLC.id,
             context: 1,
	     Propagate: 0,
	     State: "00",
	     CurrentTime: 0,
	     TimeAtLastCfg: 0,
        }
	let msg = JSON.stringify(pingLLC)
	console.log(`Sending ${msg}`)
	client.send(msg + "\n")
    }
});

client.on('close', () => {
    console.log('Application: close.');
});

client.on('error', (err) => {
    console.error('Application: An error occurred:', err.message);
});
