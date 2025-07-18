function tobytearray(s) {
    return Buffer.from(s, 'hex');
}

function frombytearray(t) {
    return Buffer.from(t).toString('hex');
}

function to_bcd_bytearray(s) {
    const result = [];
    for (let i = 0; i < s.length; i += 2) {
        const high = parseInt(s[i], 16);
        const low = parseInt(s[i + 1], 16);
        result.push((high << 4) | low);
    }
    return result;
}

function from_bcd_bytearray(t) {
    let s = '';
    for (const byte of t) {
        s += (byte >> 4).toString(16);
        s += (byte & 0x0F).toString(16);
    }
    return s;
}

module.exports = {
    tobytearray,
    frombytearray,
    to_bcd_bytearray,
    from_bcd_bytearray,
};