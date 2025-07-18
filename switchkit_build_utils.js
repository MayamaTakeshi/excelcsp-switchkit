const SwitchKit = require('./SwitchKit.js');
const {
    icbsSpec2hexstring,
    spanchannel2addrinfohexstring
} = require('./switchkit_parse_utils.js');
const hexstring = require('./hexstring.js');

function buildOutseizeControl(context, span, channel, ICBs) {
    const hstr = icbsSpec2hexstring(ICBs);
    return {
        tag: SwitchKit.Tag.OutseizeControl,
        context: context,
        Span: span,
        Channel: channel,
        ICBCount: ICBs.length,
        ICBData: hstr,
    };
}

function buildOutpulseDigits(context, span, channel, digits) {
    const DigitCount = digits.length;
    const Data = [];
    Data.push(DigitCount);
    for (let i = 0; i < DigitCount; i++) {
        const digit = digits[i];
        let value;
        if (digit === "*") {
            value = 0xE;
        } else if (digit === "#") {
            value = 0xF;
        } else {
            value = parseInt(digit, 10);
            if (value < 0 || value >= 0xF) {
                throw new Error("Invalid char " + digit);
            }
        }
        Data.push(value);
    }
    return {
        tag: SwitchKit.Tag.OutpulseDigits,
        context: context,
        Span: span,
        Channel: channel,
        SignalType: 1,
        StringCount: 1,
        StringFormat: 1,
        StringMode: 0,
        FirstDigitDuration: 0xA,
        DigitDuration: 0x8,
        InterdigitDuration: 0x8,
        DelayDuration: 0x4,
        GenerateEventFlag: 0,
        StringsData: hexstring.frombytearray(Data),
    };
}

function buildChannelPPLEventRequest(context, span, channel, componentId, pplEvent, ICBs) {
    const hstr = icbsSpec2hexstring(ICBs);
    return {
        tag: SwitchKit.Tag.PPLEventRequest,
        addrinfo: spanchannel2addrinfohexstring(span, channel),
        context: context,
        Span: span,
        Channel: channel,
        ComponentID: componentId,
        PPLEvent: pplEvent,
        ICBCount: ICBs.length,
        Data: hstr,
    };
}

function buildReleaseWithData(context, span, channel, releaseDataType, ICBs) {
    if (releaseDataType !== SwitchKit.ReleaseDataType.ISDN_ICB_Formatted_IE_and_Raw_IE_or_DASS_2_DPNSS_Raw_IE_Data && releaseDataType !== SwitchKit.ReleaseDataType.SS7_ICB) {
        throw new Error("ReleaseDataType not supported");
    }
    const hstr = icbsSpec2hexstring(ICBs);
    return {
        tag: SwitchKit.Tag.ReleaseWithData,
        context: context,
        SpanA: span,
        ChannelA: channel,
        SpanB: span,
        ChannelB: channel,
        ReleaseDataType: releaseDataType,
        Data: hexstring.frombytearray([ICBs.length]) + hstr,
    };
}

function buildRouteControl(context, ICBs) {
    const hstr = icbsSpec2hexstring(ICBs);
    return {
        tag: SwitchKit.Tag.RouteControl,
        context: context,
        AddrInfo: "00012902FFFE", // PPL Component RTR
        ICBCount: ICBs.length,
        Data: hstr,
    };
}

function buildWatchChannelGroup(context, groupName) {
    return {
        '_sk_func_': 'watchChannelGroup',
        context: context,
        groupName: groupName,
    };
}

function buildRequestChannel(context, groupName) {
    return {
        '_sk_func_': 'requestChannel',
        context: context,
        groupName: groupName,
    };
}

function buildAppGroupRegister(context, groupName) {
    return {
        '_sk_func_': 'appGroupRegister',
        context: context,
        groupName: groupName,
    };
}

function buildCloseConnection() {
    return {
        '_sk_func_': 'closeConnection',
        context: 0, // we need to set context as tester.shutdown doesn't know anything about it
    };
}

module.exports = {
    buildOutseizeControl,
    buildOutpulseDigits,
    buildChannelPPLEventRequest,
    buildReleaseWithData,
    buildWatchChannelGroup,
    buildRequestChannel,
    buildAppGroupRegister,
    buildCloseConnection,
    buildRouteControl,
};