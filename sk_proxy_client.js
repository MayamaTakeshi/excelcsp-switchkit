/**
 * Node.js ExcelCSP SwitchKit proy client
 *
 * This module provides a TcpClient class that extends EventEmitter.
 * It connects to a sk_proxy instance, listens for incoming single-line
 * JSON messages, parses them, and emits a 'data' event with the parsed JSON object.
 * It also handles connection lifecycle events and errors.
 */

const net = require('net');
const EventEmitter = require('events');

class SKProxyClient extends EventEmitter {
    /**
     * Creates an instance of TcpClient.
     * @param {string} host - The IP address or hostname of the TCP server.
     * @param {number} port - The port number of the TCP server.
     */
    constructor(host, port) {
        super(); // Call the EventEmitter constructor

        this.host = host;
        this.port = port;
        this.client = null; // The net.Socket instance
        this.buffer = '';   // Buffer to accumulate incoming data until a newline is found
        this.isConnected = false; // Connection status flag

        // Bind methods to 'this' to ensure correct context when used as event listeners
        this._handleConnect = this._handleConnect.bind(this);
        this._handleData = this._handleData.bind(this);
        this._handleEnd = this._handleEnd.bind(this);
        this._handleClose = this._handleClose.bind(this);
        this._handleError = this._handleError.bind(this);
    }

    /**
     * Establishes a connection to the TCP server.
     * @returns {Promise<void>} A promise that resolves when connected, or rejects on error.
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.client && !this.client.destroyed) {
                console.warn('Client already connected or connecting.');
                if (this.isConnected) {
                    return resolve();
                } else {
                    // If connecting, wait for existing connection attempt to complete
                    this.client.once('connect', resolve);
                    this.client.once('error', reject);
                    return;
                }
            }

            console.log(`Attempting to connect to ${this.host}:${this.port}...`);

            this.client = new net.Socket();

            // Set up event listeners for the socket
            this.client.on('connect', this._handleConnect);
            this.client.on('data', this._handleData);
            this.client.on('end', this._handleEnd);
            this.client.on('close', this._handleClose);
            this.client.on('error', this._handleError);

            // Initiate the connection
            this.client.connect(this.port, this.host, () => {
                // This callback is specifically for the initial connection attempt
                if (this.isConnected) {
                    resolve();
                } else {
                    // If for some reason _handleConnect hasn't fired yet, wait for it
                    this.client.once('connect', resolve);
                }
            });

            // Handle connection errors during the initial connect attempt
            this.client.once('error', (err) => {
                // Only reject if it's the initial connection error
                if (!this.isConnected) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Closes the TCP connection.
     */
    disconnect() {
        if (this.client && !this.client.destroyed) {
            console.log('Disconnecting from server...');
            this.client.end(); // Sends a FIN packet
            this.client.destroy(); // Ensure the socket is fully closed
        } else {
            console.log('Client not connected or already destroyed.');
        }
    }

    /**
     * Sends a message to the connected server.
     * @param {string} message - The message string to send.
     */
    send(message) {
        if (this.client && this.isConnected) {
            this.client.write(message + '\n'); // Append newline as per common line-based protocols
        } else {
            console.warn('Cannot send data: Client not connected.');
        }
    }

    /**
     * Internal handler for the 'connect' event.
     * @private
     */
    _handleConnect() {
        this.isConnected = true;
        console.log(`Successfully connected to server at ${this.host}:${this.port}`);
        this.emit('connected'); // Emit a custom 'connected' event
    }

    /**
     * Internal handler for the 'data' event from the socket.
     * Processes incoming data, extracts line-based messages, and parses JSON.
     * Emits a 'data' event for each valid JSON object.
     * @param {Buffer} data - The raw data buffer received from the server.
     * @private
     */
    _handleData(data) {
        this.buffer += data.toString();

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
                    const jsonObject = JSON.parse(message);
                    // console.log('Parsed JSON:', jsonObject); // For debugging
                    this.emit('data', jsonObject); // Emit the 'data' event with the parsed JSON
                } catch (e) {
                    console.error('Error parsing JSON:', e.message);
                    console.error('Invalid message received:', message);
                    this.emit('error', new Error(`JSON parsing error: ${e.message} - Message: ${message}`));
                }
            }
        }
    }

    /**
     * Internal handler for the 'end' event from the socket (server initiated disconnect).
     * @private
     */
    _handleEnd() {
        console.log('Server initiated disconnect.');
        // The 'close' event will follow, which handles cleanup
    }

    /**
     * Internal handler for the 'close' event from the socket.
     * Fired when the connection is fully closed.
     * @private
     */
    _handleClose() {
        this.isConnected = false;
        console.log('Connection closed.');
        this.client.destroy(); // Ensure resources are freed
        this.client = null;
        this.buffer = ''; // Clear buffer on close
        this.emit('disconnected'); // Emit a custom 'disconnected' event
    }

    /**
     * Internal handler for the 'error' event from the socket.
     * @param {Error} err - The error object.
     * @private
     */
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
