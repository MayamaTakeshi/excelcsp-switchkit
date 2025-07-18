const SKProxyClient = require('./sk_proxy_client')
//
const SwitchKit = require("./SwitchKit")

const HOST = '192.168.2.101'
const PORT = 1313

const client = new SKProxyClient(HOST, PORT);

// Listen for the 'connected' event
client.on('connected', () => {
    console.log('Application: Client is now connected!');
    let appName = "test"
    let appVersion = "1.0.0"
    let appDescription = "a_test_app"
    let instanceId = 4321
    let host = "192.168.33.3"
    let port= 1312
    let cmd = `skj_initialize ${appName} ${appVersion} ${appDescription} ${instanceId} ${host} ${port}\n`
    console.log(`Sending: ${cmd}`)
    client.send(cmd)
});

// Listen for the 'data' event (parsed JSON messages)
client.on('data', (data) => {
    console.log('Application: Received:')
    console.log(data)
    if(data._event_ == 'skj_initialize_ok') {
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

// Listen for the 'disconnected' event
client.on('disconnected', () => {
    console.log('Application: Client has disconnected.');
});

// Listen for 'error' events
client.on('error', (err) => {
    console.error('Application: An error occurred:', err.message);
    // Implement reconnection logic here if desired
    // setTimeout(() => client.connect(), 5000);
});

// Connect to the server
client.connect()
    .then(() => console.log('Application: Connection attempt initiated successfully.'))
    .catch(err => console.error('Application: Initial connection failed:', err.message));

// Handle process exit to ensure graceful shutdown
process.on('SIGINT', () => {
    console.log('\nApplication: Caught interrupt signal (Ctrl+C).');
    client.disconnect();
    process.exit(0);
});

