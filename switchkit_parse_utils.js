const SwitchKit = require('./SwitchKit.js');
const ISDN = require('./ISDN.js');
const SS7 = require('./SS7.js');
const Brastel = require('./Brastel.js');
const tester_magic = require('./tester_magic.js');
const hexstring = require('./hexstring.js');

function is_valid_hexstring(s) {
    if (typeof s !== 'string') {
        return false;
    }
    if (s.length === 0) {
        return false;
    }
    if (s.length % 2 !== 0) {
        return false;
    }
    return /^[0-9a-fA-F]+$/.test(s);
}

function from_uint16(n) {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(n, 0);
    return Array.from(buffer);
}

function convert_element_spec_to_bytearray(dict, single_byte_id, single_byte_len, element_spec) {
    const t = [];
    const [element, data_spec] = element_spec;
    const id = tester_magic.get_element_id(element);
    const serializer = dict[id] && dict[id].serializer;
    let data;

    if (serializer) {
        try {
            data = serializer(element, data_spec);
        } catch (e) {
            throw new Error(`Error in element ${tester_magic.expand_element(element)}: ${e.message}`);
        }
    } else {
        if (is_valid_hexstring(data_spec)) {
            try {
                data = Array.from(Buffer.from(data_spec, 'hex'));
            } catch (e) {
                throw new Error(`Error in element ${tester_magic.expand_element(element)}: ${e.message}`);
            }
        } else {
            throw new Error(`Error in element ${tester_magic.expand_element(element)}: not hexstring`);
        }
    }

    data = data.flat();

    if (single_byte_id) {
        t.push(id); // Element ID
        t.push(data.length); // Element Length
    } else {
        t.push(...from_uint16(id)); // Element ID
        t.push(...from_uint16(data.length)); // Element Length
    }

    t.push(...data); // Element Data
    return t;
}

function icb_table_data_processing(icbType, icbSubType, icbData) {
    let t = [];
    let dict;
    let single_byte_id;
    let single_byte_len;
    let data;

    if (icbType === SwitchKit.ICBType.Data) {
        if (icbSubType === SwitchKit.DataICBSubType.ISDN_Formatted_IEs) {
            dict = SwitchKit.ISDN_Formatted_IE;
            single_byte_id = true;
            single_byte_len = true;
            data = icbData;
        } else if (icbSubType === SwitchKit.DataICBSubType.ISDN_Raw_IEs) {
            dict = Brastel.Internal_ISDN_IE;
            single_byte_id = true;
            single_byte_len = true;
            data = icbData;
        } else if (icbSubType === SwitchKit.DataICBSubType.SS7_Parameters) {
            if (icbData.length !== 2) {
                throw new Error("Must be {byte, ss7_parameters}");
            }
            const [isup_message_id, isup_data] = icbData;
            t.push(tester_magic.get_element_id(isup_message_id));
            dict = SS7.Parameter;
            single_byte_id = true;
            single_byte_len = true;
            data = isup_data;
        }
    } else if (icbType === SwitchKit.ICBType.ExtendedData) {
        if (icbSubType === SwitchKit.ExtendedDataICBSubType.Generic_PPL) {
            dict = SwitchKit.Generic_PPL_TLV;
            single_byte_id = false;
            single_byte_len = false;
            data = icbData;
        } else if (icbSubType === SwitchKit.ExtendedDataICBSubType.NPDI_Universal_ICB) {
            dict = SwitchKit.NPDI_Universal_ICB_TLV;
            single_byte_id = false;
            single_byte_len = false;
            data = icbData;
        }
    }

    if (!dict) {
        throw new Error(`Unsupported element spec for ICBType=${tester_magic.expand_element(icbType)} ICBSubType=${tester_magic.expand_element(icbSubType)}`);
    }

    if (single_byte_id) {
        t.push(data.length);
    } else {
        t.push(...from_uint16(data.length));
    }

    for (let i = 0; i < data.length; i++) {
        t.push(...convert_element_spec_to_bytearray(dict, single_byte_id, single_byte_len, data[i]));
    }

    return hexstring.frombytearray(t.flat());
}

function* gen_iter(t) {
    for (let i = 0; i < t.length; i++) {
        yield t[i];
    }
}

function get_bytearray_from_iter(iter, len) {
    const t = [];
    for (let i = 0; i < len; i++) {
        t.push(iter.next().value);
    }
    return t;
}

function deserialize_elements(single_byte_id, single_byte_len, icb_data, element_dict) {
    const iter = gen_iter(icb_data);
    let count = iter.next().value;
    if (!single_byte_id) {
        count = count * 256;
        count = count + iter.next().value;
    }

    const deserialized_elements = [];
    for (let x = 0; x < count; x++) {
        let element_id = iter.next().value;
        if (!single_byte_id) {
            element_id = element_id * 256;
            element_id = element_id + iter.next().value;
        }
        const element = tester_magic.get_element(element_dict, element_id);

        let element_length = iter.next().value;
        if (!single_byte_len) {
            element_length = element_length * 256;
            element_length = element_length + iter.next().value;
        }

        const deserializer = typeof element === 'object' ? element.deserializer : undefined;
        const ba = get_bytearray_from_iter(iter, element_length);

        if (!deserializer) {
            deserialized_elements.push([element, hexstring.frombytearray(ba)]);
        } else {
            deserialized_elements.push([element, deserializer(element_id, ba)]);
        }
    }
    return deserialized_elements;
}

function parse_ICBsHexstring(icbCount, hstr) {
    const result = [];
    const ba = hexstring.tobytearray(hstr);
    const iter = gen_iter(ba);

    for (let x = 0; x < icbCount; x++) {
        const icbType = SwitchKit.ICBType[iter.next().value];
        let subType = iter.next().value;
        if (icbType === SwitchKit.ICBType.ExtendedData) {
            subType = subType * 256 + iter.next().value;
        }

        let icbSubType;
        if (icbType === SwitchKit.ICBType.Action) {
            icbSubType = SwitchKit.ActionICBSubType[subType];
        } else if (icbType === SwitchKit.ICBType.Data) {
            icbSubType = SwitchKit.DataICBSubType[subType];
        } else if (icbType === SwitchKit.ICBType.ExtendedData) {
            icbSubType = SwitchKit.ExtendedDataICBSubType[subType];
        }

        let icbLength = iter.next().value;
        if (icbType === SwitchKit.ICBType.ExtendedData) {
            icbLength = icbLength * 256 + iter.next().value;
        }

        const icb_data = get_bytearray_from_iter(iter, icbLength);
        let parsedIcb;

        if (icbType === SwitchKit.ICBType.Data && icbSubType === SwitchKit.DataICBSubType.ISDN_Formatted_IEs) {
            parsedIcb = [icbType, icbSubType, deserialize_elements(true, true, icb_data, SwitchKit.ISDN_Formatted_IE)];
        } else if (icbType === SwitchKit.ICBType.Data && icbSubType === SwitchKit.DataICBSubType.ISDN_Raw_IEs) {
            parsedIcb = [icbType, icbSubType, deserialize_elements(true, true, icb_data, Brastel.Internal_ISDN_IE)];
        } else if (icbType === SwitchKit.ICBType.Data && icbSubType === SwitchKit.DataICBSubType.SS7_Parameters) {
            const isup_message_id = icb_data.shift();
            parsedIcb = [icbType, icbSubType, [tester_magic.get_element(SS7.Message, isup_message_id), deserialize_elements(true, true, icb_data, SS7.Parameter)]];
        } else if (icbType === SwitchKit.ICBType.ExtendedData && icbSubType === SwitchKit.ExtendedDataICBSubType.Generic_PPL) {
            parsedIcb = [icbType, icbSubType, deserialize_elements(false, false, icb_data, SwitchKit.Generic_PPL_TLV)];
        } else if (icbType === SwitchKit.ICBType.ExtendedData && icbSubType === SwitchKit.ExtendedDataICBSubType.NPDI_Universal_ICB) {
            parsedIcb = [icbType, icbSubType, deserialize_elements(false, false, icb_data, SwitchKit.NPDI_Universal_ICB_TLV)];
        } else {
            parsedIcb = [icbType, icbSubType];
            if (icbLength > 0) {
                parsedIcb.push(hexstring.frombytearray(icb_data));
            }
        }
        result.push(parsedIcb);
    }
    return result;
}

function spanchannel2addrinfohexstring(span, channel) {
    const span_msb = Math.floor(span / 256);
    const span_lsb = span % 256;
    const byteArray = [0, 1, SwitchKit.AIB.Channel.id, 3, span_msb, span_lsb, channel];
    return hexstring.frombytearray(byteArray);
}

function icbSpec2hexstring(icbSpec) {
    const [icbType, icbSubType, icbData] = icbSpec;
    let hexData = "";

    if (icbData === undefined || icbData === null) {
        hexData = "";
    } else if (typeof icbData === 'string') {
        if (!is_valid_hexstring(icbData)) {
            throw new Error("Invalid hexstring for icb: " + JSON.stringify(icbSpec));
        }
        hexData = icbData;
    } else if (Array.isArray(icbData)) {
        hexData = icb_table_data_processing(icbType, icbSubType, icbData);
    } else {
        throw new Error("Invalid icb spec: " + JSON.stringify(icbSpec));
    }

    let result = Buffer.from([icbType.id]).toString('hex');

    if (icbType === SwitchKit.ICBType.ExtendedData) {
        const subTypeBuffer = Buffer.alloc(2);
        subTypeBuffer.writeUInt16BE(icbSubType.id, 0);
        result += subTypeBuffer.toString('hex');

        const lengthBuffer = Buffer.alloc(2);
        lengthBuffer.writeUInt16BE(hexData.length / 2, 0);
        result += lengthBuffer.toString('hex') + hexData;
    } else {
        result += Buffer.from([icbSubType.id]).toString('hex');
        result += Buffer.from([hexData.length / 2]).toString('hex') + hexData;
    }

    return result;
}

function icbsSpec2hexstring(icbsSpec) {
    return icbsSpec.map(icbSpec2hexstring).join('');
}

module.exports = {
    parse_ICBsHexstring,
    spanchannel2addrinfohexstring,
    icbsSpec2hexstring,
};