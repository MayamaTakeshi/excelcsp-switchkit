const tester_magic = require('./tester_magic.js');

const SwitchKit = {
    Tag: {},
    CallProcessingEvent: {},
    GenerateCallProcessingEvent_Event: {},
    ICBType: {},
    ActionICBSubType: {},
    DataICBSubType: {},
    ExtendedDataICBSubType: {},
    ISDN_Formatted_IE: {},
    ISDN_Raw_IE: {},
    Generic_PPL_TLV: {},
    NPDI_Universal_ICB_TLV: {},
    SS7Message: {},
    SS7NTTVariantMessage: {},
    OutpulsingSignalType: {},
    PPLComponentID: {},
    PPLEventRequest: {
        ISUP_L3P_CIC_ITU: {},
        ISDN_L3P_Call_Control: {},
        SIP_UA: {},
    },
    PPLEventIndication: {
        ISUP_L3P_CIC_ITU: {},
        ISDN_L3P_Call_Control: {},
        SIP_UA: {},
        MTP3_LSAC: {},
        MTP3_TSFC: {},
    },
    DS0StatusChangeChannelStatus: {},
    CollectDigitStringMode: {},
    SignalType: {},
    DSPServiceType: {},
    OutpulseDigitsStringFormat: {},
    OutpulseDigitsStringMode: {},
    OutpulseDigitsGenerateEventFlag: {},
    RecAnnConnectConfigurationFlag: {},
    RecAnnConnectEventFlag: {},
    ConnectTonePattern: {},
    AIB: {},
    ReleaseDataType: {},
    Status: {},
};

const magicObjects = [
    [SwitchKit.Tag, "Tag", [
        [10066, "DS0StatusChange"],
        [50006, "PingLLC"],
        [50007, "PingLLCAck"],
        [232, "RouteControl"],
        [10232, "RouteControlAck"],
        [50000, "InterAppMsg"],
        [50011, "InterAppMsgAck"],
        [50004, "UserTimer"],
        [50005, "UserTimerAck"],
        [50002, "TransferChanMsg"],
        [50020, "TransferChanMsgAck"],
        [44, "OutseizeControl"],
        [10044, "OutseizeControlAck"],
        [0, "Connect"],
        [10000, "ConnectAck"],
        [85, "RecAnnConnect"],
        [10085, "RecAnnConnectAck"],
        [47, "ConnectTonePattern"],
        [10047, "ConnectTonePatternAck"],
        [10055, "ChannelReleaseRequest"],
        [10073, "ChannelReleased"],
        [10105, "ChannelReleasedWithData"],
        [188, "CollectDigitString"],
        [10188, "CollectDigitStringAck"],
        [4, "ConnectOneWay"],
        [10004, "ConnectOneWayAck"],
        [80, "ConnectOneWayForced"],
        [10080, "ConnectOneWayForcedAck"],
        [23, "ConnectWait"],
        [10023, "ConnectWaitAck"],
        [5, "ConnectWithData"],
        [10005, "ConnectWithDataAck"],
        [3, "ConnectWithPad"],
        [10003, "ConnectWithPadAck"],
        [30, "DisconnectTonePattern"],
        [10030, "DisconnectTonePatternAck"],
        [186, "GenerateCallProcessingEvent"],
        [10186, "GenerateCallProcessingEventAck"],
        [10045, "RFSWithData"],
        [10064, "RequestForService"],
        [8, "ReleaseChannel"],
        [10008, "ReleaseChannelAck"],
        [191, "ParkChannel"],
        [10191, "ParkChannelAck"],
        [32, "OutpulseDigits"],
        [10032, "OutpulseDigitsAck"],
        [86, "RecAnnDisconnect"],
        [10086, "RecAnnDisconnectAck"],
        [68, "PPLEventRequest"],
        [10068, "PPLEventRequestAck"],
        [90, "TransmitToneQuery"],
        [10090, "TransmitToneQueryAck"],
        [190, "DSPServiceCancel"],
        [10190, "DSPServiceCancelAck"],
        [189, "DSPServiceRequest"],
        [10189, "DSPServiceRequestAck"],
        [54, "ReleaseWithData"],
        [10054, "ReleaseWithDataAck"],
        [10046, "CallProcessingEvent"],
        [10067, "PPLEventIndication"],
        [50001, "RequestChannelAck"],
        [50029, "ConnectionStatusMsg"],
    ]],
    [SwitchKit.ICBType, "ICBType", [
        [1, "Action"],
        [2, "Data"],
        [3, "ExtendedData"],
    ]],
    [SwitchKit.ActionICBSubType, "ActionICBSubType", [
        [0x0, "Null"],
        [0x5, "Outpulse_Stage_N_Address_Data"],
        [0x8, "Send_Host_Acknowledgment"],
        [0xA, "Seize"],
        [0xF, "Wait_For_Host_Control_With_Answer_Supervision"],
    ]],
    [SwitchKit.DataICBSubType, "DataICBSubType", [
        [0x10, "ISDN_Formatted_IEs"],
        [0x11, "ISDN_Raw_IEs"],
        [0x12, "SS7_Parameters"],
    ]],
    [SwitchKit.ExtendedDataICBSubType, "ExtendedDataICBSubType", [
        [0x1e, "Generic_PPL"],
        [0x33, "NPDI_Universal_ICB"],
    ]],
    [SwitchKit.ISDN_Formatted_IE, "ISDN_Formatted_IE", [
        [0x2, "Called_Party_Number", "sk_formatted_ie_called_party_number"],
        [0x3, "Calling_Party_Number", "sk_formatted_ie_calling_party_number"],
        [0x6, "Redirecting_Number", "sk_formatted_ie_redirecting_number"],
        [0x7, "Cause", "sk_formatted_ie_cause"],
    ]],
    [SwitchKit.Generic_PPL_TLV, "Generic_PPL_TLV", [
        [0x104, "RTP_Packets_Lost", "hexstring"],
        [0x105, "RTP_Packets_Received", "hexstring"],
        [0x110, "RTP_Octets_Received", "hexstring"],
        [0x111, "RTP_Packets_Sent", "hexstring"],
        [0x112, "RTP_Octets_Sent", "hexstring"],
    ]],
    [SwitchKit.NPDI_Universal_ICB_TLV, "NPDI_Universal_ICB_TLV", [
        [0x274E, "NPDI_Message_Type", "hexstring"],
        [0x2792, "Source_IP_Address", "ipv4_address"],
        [0x2793, "Source_RTP_Port", "uint32"],
    ]],
    [SwitchKit.ReleaseDataType, "ReleaseDataType", [
        [0x03, "ISDN_ICB_Formatted_IE_and_Raw_IE_or_DASS_2_DPNSS_Raw_IE_Data"],
        [0x04, "SS7_ICB"],
    ]],
    [SwitchKit.AIB, "AIB", [
        [0xD, "Channel"],
    ]],
];

magicObjects.forEach(([obj, path, items]) => {
    items.forEach(([id, name, format]) => {
        obj[name] = tester_magic.generate(id, name, `SwitchKit.${path}.${name}`, format || "");
        obj[id] = obj[name];
    });
});

function createProxy(obj, path = 'SwitchKit') {
    return new Proxy(obj, {
        get(target, prop) {
            if (prop in target) {
                const value = target[prop];
                if (typeof value === 'object' && value !== null && !value.__tester_magic__) {
                    return createProxy(value, `${path}.${String(prop)}`);
                }
                return value;
            } else {
                throw new Error(`${path}.${String(prop)} is invalid`);
            }
        }
    });
}

module.exports = createProxy(SwitchKit);