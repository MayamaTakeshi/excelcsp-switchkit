const tester_magic = require('./tester_magic.js');

const SS7_NTT = {
    Message: {
        CHG: tester_magic.generate(0xFE, "CHG", "SS7_NTT.Message.CHG"),
    },
    Parameter: {
        Charge_Area_Information: tester_magic.generate(0xFD, "Charge_Area_Information", "SS7_NTT.Parameter.Charge_Area_Information"),
        Additional_Partys_Category: tester_magic.generate(0xF3, "Additional_Partys_Category", "SS7_NTT.Parameter.Additional_Partys_Category"),
        Cause_Of_No_ID: tester_magic.generate(0xF5, "Cause_Of_No_ID", "SS7_NTT.Parameter.Cause_Of_No_ID"),
        Carrier_Information_Transfer: tester_magic.generate(0xF1, "Carrier_Information_Transfer", "SS7_NTT.Parameter.Carrier_Information_Transfer"),
        Carrier_Information_Name: tester_magic.generate(0xFB, "Carrier_Information_Name", "SS7_NTT.Parameter.Carrier_Information_Name"),
    },
};

Object.values(SS7_NTT).forEach(obj => {
    Object.values(obj).forEach(magicObj => {
        obj[magicObj.id] = magicObj;
    });
});

function createProxy(obj, path = 'SS7_NTT') {
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

module.exports = createProxy(SS7_NTT);