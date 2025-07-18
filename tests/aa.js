const switchkit = require('./switchkit')

const SwitchKit = require("./SwitchKit")

const proxy_host = '192.168.2.101'
const proxy_port = 1313
const host = '192.168.33.3'
const port = 1312
const appName = 'test'
const appVersion = '1.0.0'
const appDescription = 'a_test_app'
const instanceId = 1234

const client = switchkit.init({
	proxy_host,
	proxy_port,
	appName,
	appVersion,
	appDescription,
	instanceId,
	host,
	port,
})

switchkit.on('data', data => {
    console.log("data", data)
    if(data._event_ == 'skj_initialize_ok') {
	console.log("calling watchChannelGroup")
	switchkit.watchChannelGroup(1, "ISDN22")
    }
})



