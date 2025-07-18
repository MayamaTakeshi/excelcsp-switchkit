const hexstring = require('./hexstring.js');

function expand_element(e) {
    if (typeof e === 'object' && e.__tester_magic__) {
        return e.name;
    } else {
        return `0x${e.toString(16)}`;
    }
}

function get_element_id(e) {
    if (typeof e === 'object' && e.__tester_magic__) {
        return e.id;
    } else {
        return e;
    }
}

function get_element(dict, id) {
    if (dict[id]) {
        return dict[id];
    } else {
        return id;
    }
}

function all_bytes(t) {
    return t.every(b => b >= 0 && b <= 255);
}

const serializers = {
    hexstring: (e, s) => {
        return hexstring.tobytearray(s);
    },
    null_terminated_string: (e, s) => {
        if (typeof s !== 'string') {
            throw new Error("It must be a string");
        }
        const t = [];
        for (let i = 0; i < s.length; i++) {
            t.push(s.charCodeAt(i));
        }
        t.push(0);
        return t;
    },
    string: (e, s) => {
        if (typeof s !== 'string') {
            throw new Error("It must be a string");
        }
        const t = [];
        for (let i = 0; i < s.length; i++) {
            t.push(s.charCodeAt(i));
        }
        return t;
    },
    ipv4_address: (e, s) => {
        if (typeof s !== 'string') {
            throw new Error("It must be a string");
        }
        const t = s.split('.').map(octet => {
            const b = parseInt(octet, 10);
            if (b < 0 || b > 255) {
                throw new Error(`Invalid ipv4_address ${s}`);
            }
            return b;
        });
        if (t.length !== 4) {
            throw new Error(`Invalid ipv4_address ${s} (4 octets expected)`);
        }
        return t;
    },
    uint32: (e, n) => {
        if (typeof n !== 'string' && typeof n !== 'number') {
            throw new Error(`Invalid uint32 ${n} (it must be a string or number)`);
        }
        const num = Number(n);
        if (num < 0 || num > 0xFFFFFFFF) {
            throw new Error(`Invalid uint32 ${n} (out of range)`);
        }
        const t = [];
        for (let i = 3; i >= 0; i--) {
            const b = (num >> (8 * i)) & 0xff;
            t.push(b);
        }
        return t;
    },
    uint8: (e, n) => {
        const val = get_element_id(n);
        const num = Number(val);
        if (num < 0 || num > 0xFF) {
            throw new Error(`Invalid uint ${n} (out of range)`);
        }
        return [num];
    },
    sk_formatted_ie_called_party_number: (e, t) => {
        if (!Array.isArray(t) || t.length !== 3) {
            throw new Error("Must be {byte, byte, string})");
        }
        let [typeOfNumber, numberingPlan, address] = t;
        typeOfNumber = get_element_id(typeOfNumber);
        numberingPlan = get_element_id(numberingPlan);
        if (!all_bytes([typeOfNumber, numberingPlan]) || typeof address !== 'string') {
            throw new Error("Must be {byte, byte, string})");
        }
        return [typeOfNumber, numberingPlan, address.length, ...Buffer.from(address, 'ascii')];
    },
    sk_formatted_ie_calling_party_number: (e, t) => {
        if (!Array.isArray(t) || t.length !== 5) {
            throw new Error("Must be {byte, byte, byte, byte, string})");
        }
        let [typeOfNumber, numberingPlan, presentationIndicator, screeningIndicator, address] = t;
        typeOfNumber = get_element_id(typeOfNumber);
        numberingPlan = get_element_id(numberingPlan);
        presentationIndicator = get_element_id(presentationIndicator);
        screeningIndicator = get_element_id(screeningIndicator);
        if (!all_bytes([typeOfNumber, numberingPlan, presentationIndicator, screeningIndicator]) || typeof address !== 'string') {
            throw new Error("Must be {byte, byte, byte, byte, string})");
        }
        return [typeOfNumber, numberingPlan, presentationIndicator, screeningIndicator, address.length, ...Buffer.from(address, 'ascii')];
    },
    sk_formatted_ie_redirecting_number: (e, t) => {
        if (!Array.isArray(t) || t.length !== 6) {
            throw new Error("Must be {byte, byte, byte, byte, byte, string})");
        }
        let [typeOfNumber, numberingPlan, presentationIndicator, screeningIndicator, redirectingReason, address] = t;
        typeOfNumber = get_element_id(typeOfNumber);
        numberingPlan = get_element_id(numberingPlan);
        presentationIndicator = get_element_id(presentationIndicator);
        screeningIndicator = get_element_id(screeningIndicator);
        redirectingReason = get_element_id(redirectingReason);
        if (!all_bytes([typeOfNumber, numberingPlan, presentationIndicator, screeningIndicator, redirectingReason]) || typeof address !== 'string') {
            throw new Error("Must be {byte, byte, byte, byte, byte, string})");
        }
        return [typeOfNumber, numberingPlan, presentationIndicator, screeningIndicator, redirectingReason, address.length, ...Buffer.from(address, 'ascii')];
    },
    sk_formatted_ie_cause: (e, t) => {
        if (!Array.isArray(t) || t.length !== 1) {
            throw new Error("Must be {byte})");
        }
        let [cause] = t;
        cause = get_element_id(cause);
        if (!all_bytes([cause])) {
            throw new Error("Must be {byte})");
        }
        return [0, 0, 0, cause, 0];
    },
    ss7_parameter_called_party_number: (e, t) => {
        if (!Array.isArray(t) || t.length !== 4) {
            throw new Error("Must be {byte, byte, byte, string})");
        }
        let [natureOfAddressIndicator, innIndicator, numberingPlanIndicator, address] = t;
        natureOfAddressIndicator = get_element_id(natureOfAddressIndicator);
        innIndicator = get_element_id(innIndicator);
        numberingPlanIndicator = get_element_id(numberingPlanIndicator);

        if (!all_bytes([natureOfAddressIndicator, innIndicator, numberingPlanIndicator]) || typeof address !== 'string') {
            throw new Error("Must be {byte, byte, byte, string})");
        }

        const oddEvenIndicator = address.length % 2;
        if (oddEvenIndicator === 1) {
            address += '0';
        }

        return [
            (oddEvenIndicator << 7) | natureOfAddressIndicator,
            (innIndicator << 7) | (numberingPlanIndicator << 4),
            ...hexstring.to_bcd_bytearray(address).map(b => (b >> 4) | ((b & 0x0F) << 4))
        ];
    },
    ss7_parameter_calling_party_number: (e, t) => {
        if (!Array.isArray(t) || t.length !== 6) {
            throw new Error("Must be {byte, byte, byte, byte, byte, string})");
        }
        let [natureOfAddressIndicator, callingPartyNumberIncompleteIndicator, numberingPlanIndicator, presentationRestrictionIndicator, screeningIndicator, address] = t;
        natureOfAddressIndicator = get_element_id(natureOfAddressIndicator);
        callingPartyNumberIncompleteIndicator = get_element_id(callingPartyNumberIncompleteIndicator);
        numberingPlanIndicator = get_element_id(numberingPlanIndicator);
        presentationRestrictionIndicator = get_element_id(presentationRestrictionIndicator);
        screeningIndicator = get_element_id(screeningIndicator);

        if (!all_bytes([natureOfAddressIndicator, callingPartyNumberIncompleteIndicator, numberingPlanIndicator, presentationRestrictionIndicator, screeningIndicator]) || typeof address !== 'string') {
            throw new Error("Must be {byte, byte, byte, byte, byte, string})");
        }

        const oddEvenIndicator = address.length % 2;
        if (oddEvenIndicator === 1) {
            address += '0';
        }

        return [
            (oddEvenIndicator << 7) | natureOfAddressIndicator,
            (callingPartyNumberIncompleteIndicator << 7) | (numberingPlanIndicator << 4) | (presentationRestrictionIndicator << 2) | screeningIndicator,
            ...hexstring.to_bcd_bytearray(address).map(b => (b >> 4) | ((b & 0x0F) << 4))
        ];
    },
    switchkit_ss7_parameter_cause_indicators: (e, t) => {
        if (!Array.isArray(t) || t.length !== 2) {
            throw new Error("Must be {Location, CauseCode})");
        }
        let [location, causeCode] = t;
        location = get_element_id(location);
        causeCode = get_element_id(causeCode);

        if (!all_bytes([location, causeCode])) {
            throw new Error("Must be {Location, CauseCode})");
        }

        return [
            0x80 | location,
            0x80 | causeCode,
        ];
    },
};

const deserializers = {
    hexstring: (e, t) => {
        return hexstring.frombytearray(t);
    },
    null_terminated_string: (e, t) => {
        let s = "";
        for (let i = 0; i < t.length - 1; i++) {
            s += String.fromCharCode(t[i]);
        }
        return s;
    },
    string: (e, t) => {
        let s = "";
        for (let i = 0; i < t.length; i++) {
            s += String.fromCharCode(t[i]);
        }
        return s;
    },
    ipv4_address: (e, t) => {
        return `${t[0]}.${t[1]}.${t[2]}.${t[3]}`;
    },
    uint32: (e, t) => {
        let n = 0;
        n += t[0] * (256 ** 3);
        n += t[1] * (256 ** 2);
        n += t[2] * 256;
        n += t[3];
        return n;
    },
    uint8: (e, t) => {
        return t[0];
    },
    sk_formatted_ie_called_party_number: (e, t) => {
        if (t.length < 3) {
            console.error(`Unrecoverable error: sk_formatted_ie_called_party_number deserializer got invalid table (need at least 3 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        const typeOfNumber = t[0];
        const numberingPlan = t[1];
        const addressLength = t[2];
        const address = t.slice(3);
        if (addressLength !== address.length) {
            console.error(`Unrecoverable error: sk_formatted_ie_called_party_number deserializer got invalid table (addressLength inconsistent with IE): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        return [
            get_element(ISDN.TypeOfNumber, typeOfNumber),
            get_element(ISDN.NumberingPlan, numberingPlan),
            Buffer.from(address).toString('ascii')
        ];
    },
    sk_formatted_ie_calling_party_number: (e, t) => {
        if (t.length < 5) {
            console.error(`Unrecoverable error: sk_formatted_ie_calling_party_number deserializer got invalid table (need at least 5 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        const typeOfNumber = t[0];
        const numberingPlan = t[1];
        const presentationIndicator = t[2];
        const screeningIndicator = t[3];
        const addressLength = t[4];
        const address = t.slice(5);
        if (addressLength !== address.length) {
            console.error(`Unrecoverable error: sk_formatted_ie_calling_party_number deserializer got invalid table (addressLength inconsistent with IE): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        return [
            get_element(ISDN.TypeOfNumber, typeOfNumber),
            get_element(ISDN.NumberingPlan, numberingPlan),
            get_element(ISDN.PresentationIndicator, presentationIndicator),
            get_element(ISDN.ScreeningIndicator, screeningIndicator),
            Buffer.from(address).toString('ascii')
        ];
    },
    sk_formatted_ie_redirecting_number: (e, t) => {
        if (t.length < 6) {
            console.error(`Unrecoverable error: sk_formatted_ie_redirecting_number deserializer got invalid table (need at least 6 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        const typeOfNumber = t[0];
        const numberingPlan = t[1];
        const presentationIndicator = t[2];
        const screeningIndicator = t[3];
        const redirectingIndicator = t[4];
        const addressLength = t[5];
        const address = t.slice(6);
        if (addressLength !== address.length) {
            console.error(`Unrecoverable error: sk_formatted_ie_redirecting_number deserializer got invalid table (addressLength inconsistent with IE): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        return [
            get_element(ISDN.TypeOfNumber, typeOfNumber),
            get_element(ISDN.NumberingPlan, numberingPlan),
            get_element(ISDN.PresentationIndicator, presentationIndicator),
            get_element(ISDN.ScreeningIndicator, screeningIndicator),
            get_element(ISDN.RedirectingIndicator, redirectingIndicator),
            Buffer.from(address).toString('ascii')
        ];
    },
    sk_formatted_ie_cause: (e, t) => {
        if (t.length !== 5) {
            console.error(`Unrecoverable error: sk_formatted_ie_cause deserializer got invalid table (need 5 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        return [
            get_element(ISDN.CauseCode, t[3]),
        ];
    },
    ss7_parameter_called_party_number: (e, t) => {
        if (t.length < 2) {
            console.error(`Unrecoverable error: ss7_parameter_called_party_number deserializer got invalid table (need at least 2 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        const evenOddIndicator = t[0] >> 7;
        const natureOfAddressIndicator = t[0] & 0x7F;
        const innIndicator = t[1] >> 7;
        const numberingPlanIndicator = (t[1] >> 4) & 0x7;
        const addressBytes = t.slice(2);
        let address = hexstring.from_bcd_bytearray(addressBytes.map(b => (b >> 4) | ((b & 0x0F) << 4)));
        if (evenOddIndicator === 1) {
            address = address.slice(0, -1);
        }
        return [
            get_element(SS7.NatureOfAddressIndicator, natureOfAddressIndicator),
            get_element(SS7.INN_Indicator, innIndicator),
            get_element(SS7.NumberingPlanIndicator, numberingPlanIndicator),
            address
        ];
    },
    ss7_parameter_calling_party_number: (e, t) => {
        if (t.length < 2) {
            console.error(`Unrecoverable error: ss7_parameter_calling_party_number deserializer got invalid table (need at least 2 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        const evenOddIndicator = t[0] >> 7;
        const natureOfAddressIndicator = t[0] & 0x7F;
        const callingPartyNumberIncompleteIndicator = t[1] >> 7;
        const numberingPlanIndicator = (t[1] >> 4) & 0x7;
        const presentationRestrictionIndicator = (t[1] >> 2) & 0x3; // Corrected mask
        const screeningIndicator = t[1] & 0x3; // Corrected mask
        const addressBytes = t.slice(2);
        let address = hexstring.from_bcd_bytearray(addressBytes.map(b => (b >> 4) | ((b & 0x0F) << 4)));
        if (evenOddIndicator === 1) {
            address = address.slice(0, -1);
        }
        return [
            get_element(SS7.NatureOfAddressIndicator, natureOfAddressIndicator),
            get_element(SS7.CallingPartyNumberIncompleteIndicator, callingPartyNumberIncompleteIndicator),
            get_element(SS7.NumberingPlanIndicator, numberingPlanIndicator),
            get_element(SS7.PresentationRestrictionIndicator, presentationRestrictionIndicator),
            get_element(SS7.ScreeningIndicator, screeningIndicator),
            address
        ];
    },
    switchkit_ss7_parameter_cause_indicators: (e, t) => {
        if (t.length !== 2) {
            console.error(`Unrecoverable error: switchkit_ss7_parameter_cause_indicators deserializer got invalid table (need 2 bytes): ${JSON.stringify(t)}`);
            process.exit(1);
        }
        const location = t[0] & 0x0F;
        const causeCode = t[1] & 0x7F;
        return [
            get_element(SS7.Location, location),
            get_element(ISDN.CauseCode, causeCode)
        ];
    },
};

function gen_tester_magic(id, name, full_name, format) {
    return {
        __tester_magic__: true,
        id: id,
        name: name,
        full_name: full_name,
        serializer: serializers[format],
        deserializer: deserializers[format],
    };
}

module.exports = {
    expand_element,
    get_element_id,
    get_element,
    generate: gen_tester_magic,
};