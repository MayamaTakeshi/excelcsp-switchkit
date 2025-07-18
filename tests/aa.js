const {SKProxyClient, SwitchKit} = require('../index')

const args = {
    proxy_host: '192.168.2.101',
    proxy_port: 1313,
    app_name: 'test',
    app_version: '1.0.0',
    app_description: 'a_test_app',
    instance_id: 1234,
    host: '192.168.33.3',
    port: 1312,
}

const client = new SKProxyClient(args)

client.on('event', evt => {
    console.log("event", evt)
    if(evt._event_ == 'skj_initialize_ok') {
        console.log("calling watchChannelGroup")
        client.watchChannelGroup(1, "ISDN22")
    }
})

process.on('SIGINT', () => {
    console.log('\nApplication: Caught interrupt signal (Ctrl+C).');
    client.disconnect();
    process.exit(0);
});

