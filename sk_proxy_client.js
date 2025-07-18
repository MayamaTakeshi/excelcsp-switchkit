/**
 * Node.js ExcelCSP SwitchKit proxy client
 *
 * This module provides a TcpClient class that extends EventEmitter.
 * It connects to a sk_proxy instance, listens for incoming single-line
 * JSON messages, parses them, and emits a 'data' event with the parsed JSON object.
 * It also handles connection lifecycle events and errors.
 */

const net = require('net');
const EventEmitter = require('events');
const switchkit_build_utils = require('./switchkit_build_utils')

class SKProxyClient extends EventEmitter {
    constructor(args) {
        super();
 
        this.proxy_host = args.proxy_host
        this.proxy_port = args.proxy_port
        this.app_name = args.app_name.replace(/ /g, "_")
        this.app_version = args.app_version.replace(/ /g, "_")
        this.app_description = args.app_description.replace(/ /g, "_")
        this.instance_id = parseInt(args.instance_id)

        this.host = args.host
        this.port = args.port

        this.client = null;
        this.buffer = '';   // Buffer to accumulate incoming data until a newline is found
        this.isConnected = false; // Connection status flag

        // Bind methods to 'this' to ensure correct context when used as event listeners
        this._handleData = this._handleData.bind(this);
        this._handleEnd = this._handleEnd.bind(this);
        this._handleClose = this._handleClose.bind(this);
        this._handleError = this._handleError.bind(this);

        console.log(`Attempting to connect to ${this.proxy_host}:${this.proxy_port}...`);

        this.client = new net.Socket();

        // Set up event listeners for the socket
        this.client.on('data', this._handleData);
        this.client.on('end', this._handleEnd);
        this.client.on('close', this._handleClose);
        this.client.on('error', this._handleError);

        // Initiate the connection
        this.client.connect(this.proxy_port, this.proxy_host, () => {
            console.log("connected")
            this.isConnected = true;
            let cmd = `skj_initialize ${this.app_name} ${this.app_version} ${this.app_description} ${this.instance_id} ${this.host} ${this.port}\n`
            console.log(`Sending: ${cmd}`)
            this.client.write(cmd)
        })

        // Handle connection errors during the initial connect attempt
        this.client.once('error', (err) => {
            this.emit('error', err)
        });
    }

    disconnect() {
        if (this.client && !this.client.destroyed) {
            console.log('Disconnecting from server...');
            this.client.end(); // Sends a FIN packet
            this.client.destroy(); // Ensure the socket is fully closed
        } else {
            console.log('Client not connected or already destroyed.');
        }
    }

    send(message) {
        if (this.client && this.isConnected) {
            this.client.write(message + '\n'); // Append newline as per common line-based protocols
        } else {
            console.warn('Cannot send data: Client not connected.');
        }
    }

    sendCmd(req) {
        const json_req = JSON.stringify(req);
        this.send(json_req);
    }

    sendMsg(req) {
        req['_sk_func_'] = 'sendMsg';
        if(typeof req.tag === 'object') {
            req.tag = req.tag.id
        }
        this.sendCmd(req);
    }

    watchChannelGroup(context, groupName) {
        this.sendCmd(switchkit_build_utils.buildWatchChannelGroup(context, groupName));
    }

    requestChannel(context, groupName) {
        this.sendCmd(switchkit_build_utils.buildRequestChannel(context, groupName));
    }

    appGroupRegister(groupName, context) {
        this.sendCmd(switchkit_build_utils.buildAppGroupRegister(groupName, context));
    }

    sendOutseizeControl(context, span, channel, ICBs) {
        this.sendMsg(switchkit_build_utils.buildOutseizeControl(context, span, channel, ICBs));
    }

    sendOutpulseDigits(context, span, channel, digits) {
        this.sendMsg(switchkit_build_utils.buildOutpulseDigits(context, span, channel, digits));
    }

    sendChannelPPLEventRequest(context, span, channel, componentId, pplEvent, ICBs) {
        this.sendMsg(switchkit_build_utils.buildChannelPPLEventRequest(context, span, channel, componentId, pplEvent, ICBs));
    }

    sendReleaseWithData(context, span, channel, releaseDataType, ICBs) {
        this.sendMsg(switchkit_build_utils.buildReleaseWithData(context, span, channel, releaseDataType, ICBs));
    }

    sendRouteControl(context, ICBs) {
        this.sendMsg(switchkit_build_utils.buildRouteControl(context, ICBs));
    }

    shutdown() {
        this.sendCmd(switchkit_build_utils.buildCloseConnection());
    }

    _handleData(data) {
        //console.log("data", data)
        this.buffer += data.toString();
        //console.log(this.buffer.toString())

        let newlineIndex;
        // Process the buffer line by line
        while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
            // Extract a single line (message)
            const message = this.buffer.substring(0, newlineIndex).trim();

            // Remove the processed message from the buffer
            this.buffer = this.buffer.substring(newlineIndex + 1);

            if (message.length > 0) {
                try {
                    // Attempt to parse the message as a JSON string
                    const evt = JSON.parse(message);
                    //console.log('evt:', evt)
                    this.emit('event', evt); 
                } catch (e) {
                    console.error('Error parsing JSON:', e.message);
                    console.error('Invalid message received:', message);
                    this.emit('error', new Error(`JSON parsing error: ${e.message} - Message: ${message}`));
                }
            }
        }
    }

    _handleEnd() {
        console.log('Server initiated disconnect.');
        this.emit('end')
        // The 'close' event will follow, which handles cleanup
    }

    _handleClose() {
        this.isConnected = false;
        this.client.destroy(); // Ensure resources are freed
        this.client = null;
        this.buffer = ''; // Clear buffer on close
        this.emit('close'); 
    }

    _handleError(err) {
        console.error(`TCP Client error: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.error('Connection refused. Ensure the server is running and accessible.');
        }
        this.isConnected = false; // Mark as disconnected on error
        this.client.destroy(); // Ensure the socket is fully closed
        this.client = null;
        this.buffer = ''; // Clear buffer on error
        this.emit('error', err); // Re-emit the error for the consumer to handle
    }
}

module.exports = SKProxyClient;
