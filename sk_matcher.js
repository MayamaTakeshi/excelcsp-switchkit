const tester_magic = require('./tester_magic.js');
const SwitchKit = require('./SwitchKit.js');

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


module.exports = matcher
