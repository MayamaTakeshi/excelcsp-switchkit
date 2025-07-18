const EventEmitter = require('events');
const SKProxyClient = require('./sk_proxy_client.js');
const tester_magic = require('./tester_magic.js');
const SwitchKit = require('./SwitchKit.js');
const switchkit_build_utils = require('./switchkit_build_utils.js');
const switchkit_parse_utils = require('./switchkit_parse_utils.js');

let initialized = false;
let _params = null;
let sk_proxy_skt = null;

const switchkit = new EventEmitter();

function matcher(expected, received, env) {
    function get_id(e) {
        if (typeof e === 'object' && e._tester_magic_) {
            return e.id;
        } else {
            return e;
        }
    }

    function get_received_icb_data(icb_type_e, icb_subtype_e, received) {
        for (let i = 0; i < received.length; i++) {
            const [icb_type_r, icb_subtype_r] = received[i];
            if (get_id(icb_type_e) === get_id(icb_type_r) && get_id(icb_subtype_e) === get_id(icb_subtype_r)) {
                return received[i][2];
            }
        }
        return null;
    }

    function get_received_icb_element_data(element_e, received) {
        for (let i = 0; i < received.length; i++) {
            const [element_r] = received[i];
            if (get_id(element_e) === get_id(element_r)) {
                return received[i][2];
            };
        }
        return null;
    }

    for (const k in expected) {
        if (!received.hasOwnProperty(k)) {
            throw new Error(`Expected key ${k} not found in received event`);
        }

        const e = expected[k];
        const r = received[k];

        if (k === 'ICBs') {
            if (!Array.isArray(e)) {
                throw new Error("Invalid spec for ICBs");
            }
            for (let i = 0; i < e.length; i++) {
                if (e[i].length !== 3) {
                    throw new Error("Invalid spec for ICB");
                }
                const [icb_type_e, icb_subtype_e, icb_data_e] = e[i];
                const icb_data_r = get_received_icb_data(icb_type_e, icb_subtype_e, r);
                if (!icb_data_r) {
                    throw new Error("Expected ICB not received");
                }

                let data_e, data_r;
                if (icb_type_e === SwitchKit.ICBType.Data && icb_subtype_e === SwitchKit.DataICBSubType.SS7_Parameters) {
                    const [isup_message_id_e, isup_data_e] = icb_data_e;
                    const [isup_message_id_r, isup_data_r] = icb_data_r;

                    if (tester_magic.get_element_id(isup_message_id_e) !== tester_magic.get_element_id(isup_message_id_r)) {
                        throw new Error("No match for ISUP Message ID");
                    }
                    data_e = isup_data_e;
                    data_r = isup_data_r;
                } else {
                    data_e = icb_data_e;
                    data_r = icb_data_r;
                }

                for (let j = 0; j < data_e.length; j++) {
                    if (data_e[j].length !== 2) {
                        throw new Error(`Invalid spec for ICB element: ${JSON.stringify(data_e[j])}`);
                    }
                    const [element_e, element_data_e] = data_e[j];
                    const element_data_r = get_received_icb_element_data(element_e, data_r);
                    if (!element_data_r) {
                        throw new Error("Expected ICB element not received");
                    }
                    // This is a placeholder for a generic matching function
                    // You might need to implement a deep equality check here
                    if (JSON.stringify(element_data_e) !== JSON.stringify(element_data_r)) {
                        throw new Error(`Mismatch for element ${tester_magic.expand_element(element_e)}`);
                    }
                }
            }
        } else {
            // This is a placeholder for a generic matching function
            // You might need to implement a deep equality check here
            if (JSON.stringify(e) !== JSON.stringify(r)) {
                throw new Error(`Mismatch for key ${k}`);
            }
        }
    }
}



switchkit.init = function(params) {
    if (initialized) {
        throw new Error("Already initialized");
    }

    ['appName', 'appVersion', 'appDescription', 'instanceId', 'host', 'port'].forEach(p => {
        if (!params[p]) {
            throw new Error(`Expected parameter ${p} is missing`);
        }
    });

    sk_proxy_skt = new SKProxyClient(params.proxy_host, params.proxy_port);

    sk_proxy_skt.on('data', (event) => {
        if (event._event_ === 'sk_func_res' && event.Success === true) {
       	    switchkit.emit('data', event);
	    return
        }

        if (event._event_ === 'sk_msg' || event._event_ === 'sk_msg_ack') {
            event.tag = SwitchKit.Tag[event.tag];
        }

        if (event._event_ === 'sk_msg') {
            if (event.tag === SwitchKit.Tag.RFSWithData) {
                const icbCount = parseInt(event.Data.substring(0, 2), 16);
                const icbData = event.Data.substring(2);
                event.ICBs = switchkit_parse_utils.parse_ICBsHexstring(icbCount, icbData);
            } else if (event.tag === SwitchKit.Tag.CallProcessingEvent) {
                event.Event = SwitchKit.CallProcessingEvent[event.Event];
                if (event.digits && _params.dtmf_to_prompts) {
                    event.prompts = _params.dtmf_to_prompts(event.digits);
                }
            } else if (event.tag === SwitchKit.Tag.PPLEventIndication) {
                event.PPLEvent = SwitchKit.PPLEventIndication[event.ComponentID][event.PPLEvent];
                event.ComponentID = SwitchKit.PPLComponentID[event.ComponentID];
                event.ICBs = switchkit_parse_utils.parse_ICBsHexstring(event.ICBCount, event.Data);
            } else if (event.tag === SwitchKit.Tag.ChannelReleasedWithData) {
                event.ICBs = switchkit_parse_utils.parse_ICBsHexstring(event.ICBCount, event.ICBData);
            }
        }

        switchkit.emit('data', event);
    });

    sk_proxy_skt.connect().then(() => {
        console.log('connected to server!');
        sk_proxy_skt.send(`skj_initialize ${params.appName} ${params.appVersion} ${params.appDescription} ${params.instanceId} ${params.host} ${params.port}`);
    });

    _params = params;

    function sendCmd(req) {
        const json_req = JSON.stringify(req);
        sk_proxy_skt.send(json_req);
    }

    function sendMsg(req) {
        // tester_magic.expand_magic_ids(req); // This function is not defined in the provided code
        req['_sk_func_'] = 'sendMsg';
        if(typeof req.tag === 'object') {
            req.tag = req.tag.id
        }
        sendCmd(req);
    }

    switchkit.watchChannelGroup = (context, groupName) => sendCmd(switchkit_build_utils.buildWatchChannelGroup(context, groupName));
    switchkit.requestChannel = (context, groupName) => sendCmd(switchkit_build_utils.buildRequestChannel(context, groupName));
    switchkit.appGroupRegister = (groupName, context) => sendCmd(switchkit_build_utils.buildAppGroupRegister(groupName, context));
    switchkit.sendOutseizeControl = (context, span, channel, ICBs) => sendMsg(switchkit_build_utils.buildOutseizeControl(context, span, channel, ICBs));
    switchkit.sendOutpulseDigits = (context, span, channel, digits) => sendMsg(switchkit_build_utils.buildOutpulseDigits(context, span, channel, digits));
    switchkit.sendChannelPPLEventRequest = (context, span, channel, componentId, pplEvent, ICBs) => sendMsg(switchkit_build_utils.buildChannelPPLEventRequest(context, span, channel, componentId, pplEvent, ICBs));
    switchkit.sendReleaseWithData = (context, span, channel, releaseDataType, ICBs) => sendMsg(switchkit_build_utils.buildReleaseWithData(context, span, channel, releaseDataType, ICBs));
    switchkit.sendRouteControl = (context, ICBs) => sendMsg(switchkit_build_utils.buildRouteControl(context, ICBs));

    switchkit.shutdown = () => sendCmd(switchkit_build_utils.buildCloseConnection());

    

    initialized = true;
};

switchkit._name = 'switchkit';
switchkit._matcher = matcher;

module.exports = switchkit;
