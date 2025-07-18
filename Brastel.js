const tester_magic = require('./tester_magic.js');

const Brastel = {
    Internal_ISDN_IE: {
        RequestedDestinationNumber: tester_magic.generate(80, "RequestedDestinationNumber", "Brastel.Internal_ISDN_IE.RequestedDestinationNumber", "string"),
        RequestedOutseizeOption: tester_magic.generate(81, "RequestedOutseizeOption", "Brastel.Internal_ISDN_IE.RequestedOutseizeOption", "uint8"),
        OriginatingCarrierID: tester_magic.generate(82, "OriginatingCarrierID", "Brastel.Internal_ISDN_IE.OriginatingCarrierID", "string"),
        OriginatingCACode: tester_magic.generate(83, "OriginatingCACode", "Brastel.Internal_ISDN_IE.OriginatingCACode", "string"),
        UserAddressType: tester_magic.generate(84, "UserAddressType", "Brastel.Internal_ISDN_IE.UserAddressType", "uint8"),
        AdditionalUserAddressType: tester_magic.generate(85, "AdditionalUserAddressType", "Brastel.Internal_ISDN_IE.AdditionalUserAddressType", "uint8"),
        CallRelayData_Suplement: tester_magic.generate(86, "CallRelayData_Suplement", "Brastel.Internal_ISDN_IE.CallRelayData_Suplement"),
        CallRelayData_Suplement_Flag: tester_magic.generate(87, "CallRelayData_Suplement_Flag", "Brastel.Internal_ISDN_IE.CallRelayData_Suplement_Flag"),
    },
    CauseOfNoID: {
        NotReceived: tester_magic.generate(-1, "NotReceived", "Brastel.CauseOfNoID.NotReceived"),
        Unavailable: tester_magic.generate(0, "Unavailable", "Brastel.CauseOfNoID.Unavailable"),
        RejectedByUser: tester_magic.generate(1, "RejectedByUser", "Brastel.CauseOfNoID.RejectedByUser"),
        InteractionWithOtherService: tester_magic.generate(2, "InteractionWithOtherService", "Brastel.CauseOfNoID.InteractionWithOtherService"),
        Payphone: tester_magic.generate(3, "Payphone", "Brastel.CauseOfNoID.Payphone"),
    },
    AdditionalAddressType: {
        Train_Public: tester_magic.generate(0, "Train_Public", "Brastel.AdditionalAddressType.Train_Public"),
        Pink_Telephone: tester_magic.generate(1, "Pink_Telephone", "Brastel.AdditionalAddressType.Pink_Telephone"),
        PDC_800MHZ: tester_magic.generate(2, "PDC_800MHZ", "Brastel.AdditionalAddressType.PDC_800MHZ"),
        PDC_1500MHZ: tester_magic.generate(3, "PDC_1500MHZ", "Brastel.AdditionalAddressType.PDC_1500MHZ"),
        NSTAR_Satellite: tester_magic.generate(4, "NSTAR_Satellite", "Brastel.AdditionalAddressType.NSTAR_Satellite"),
        CDMA_800MHZ: tester_magic.generate(5, "CDMA_800MHZ", "Brastel.AdditionalAddressType.CDMA_800MHZ"),
        IMT2000: tester_magic.generate(6, "IMT2000", "Brastel.AdditionalAddressType.IMT2000"),
        PHS: tester_magic.generate(7, "PHS", "Brastel.AdditionalAddressType.PHS"),
        unknown: tester_magic.generate(255, "unknown", "Brastel.AdditionalAddressType.unknown"),
    },
    AddressType: {
        User: tester_magic.generate(0, "User", "Brastel.AddressType.User"),
        Private_Network_Serving_Local_User: tester_magic.generate(1, "Private_Network_Serving_Local_User", "Brastel.AddressType.Private_Network_Serving_Local_User"),
        Public_Network_Serving_Local_User: tester_magic.generate(2, "Public_Network_Serving_Local_User", "Brastel.AddressType.Public_Network_Serving_Local_User"),
        Transit_Network: tester_magic.generate(3, "Transit_Network", "Brastel.AddressType.Transit_Network"),
        Public_Network_Serving_Remote_User: tester_magic.generate(4, "Public_Network_Serving_Remote_User", "Brastel.AddressType.Public_Network_Serving_Remote_User"),
        Private_Network_Serving_Remote_User: tester_magic.generate(5, "Private_Network_Serving_Remote_User", "Brastel.AddressType.Private_Network_Serving_Remote_User"),
        Reserved1: tester_magic.generate(6, "Reserved1", "Brastel.AddressType.Reserved1"),
        International_Networks: tester_magic.generate(7, "International_Networks", "Brastel.AddressType.International_Networks"),
        Reserved2: tester_magic.generate(8, "Reserved2", "Brastel.AddressType.Reserved2"),
        Reserved3: tester_magic.generate(9, "Reserved3", "Brastel.AddressType.Reserved3"),
        Network_Beyond_Interworking_Point: tester_magic.generate(10, "Network_Beyond_Interworking_Point", "Brastel.AddressType.Network_Beyond_Interworking_Point"),
        Reserved5: tester_magic.generate(11, "Reserved5", "Brastel.AddressType.Reserved5"),
        Reserved6: tester_magic.generate(12, "Reserved6", "Brastel.AddressType.Reserved6"),
        Reserved7: tester_magic.generate(13, "Reserved7", "Brastel.AddressType.Reserved7"),
        Reserved8: tester_magic.generate(14, "Reserved8", "Brastel.AddressType.Reserved8"),
        Mobile: tester_magic.generate(15, "Mobile", "Brastel.AddressType.Mobile"),
        Public: tester_magic.generate(16, "Public", "Brastel.AddressType.Public"),
        FixedPhone: tester_magic.generate(17, "FixedPhone", "Brastel.AddressType.FixedPhone"),
        PHS: tester_magic.generate(18, "PHS", "Brastel.AddressType.PHS"),
        EMOBILE: tester_magic.generate(19, "EMOBILE", "Brastel.AddressType.EMOBILE"),
        Unknown: tester_magic.generate(255, "Unknown", "Brastel.AddressType.Unknown"),
    },
};

Object.values(Brastel).forEach(obj => {
    Object.values(obj).forEach(magicObj => {
        obj[magicObj.id] = magicObj;
    });
});

function createProxy(obj, path = 'Brastel') {
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

module.exports = createProxy(Brastel);