const switchkit = require('../switchkit')

const SwitchKit = require("../SwitchKit")

const proxy_host = '192.168.2.101'
const proxy_port = 1313
const host = '192.168.33.3'
const port = 1312
const appName = 'test'
const appVersion = '1.0.0'
const appDescription = 'a_test_app'
const instanceId = 1234

let ISDN = require('../ISDN')
let sbu = require('../switchkit_build_utils')

const client = switchkit.init({
	proxy_host,
	proxy_port,
	appName,
	appVersion,
	appDescription,
	instanceId,
	host,
	port,
})

switchkit.on('data', data => {
    console.log("data", data)
    if(data._event_ == 'skj_initialize_ok') {
	let context = 1
	let span = 80
	let channel = 23

	let called_number = '05012341234'
	let calling_number = '0311112222'

	let ICBs = [
		[SwitchKit.ICBType.Action, SwitchKit.ActionICBSubType.Seize],
		[SwitchKit.ICBType.Action, SwitchKit.ActionICBSubType.Outpulse_Stage_N_Address_Data, "01"],
		[SwitchKit.ICBType.Action, SwitchKit.ActionICBSubType.Send_Host_Acknowledgment],
		[SwitchKit.ICBType.Action, SwitchKit.ActionICBSubType.Wait_For_Host_Control_With_Answer_Supervision],
		[SwitchKit.ICBType.Data, SwitchKit.DataICBSubType.ISDN_Formatted_IEs,
			[
				[SwitchKit.ISDN_Formatted_IE.Called_Party_Number,
					[
						ISDN.TypeOfNumber.Unknown,
						ISDN.NumberingPlan.Unknown,
						called_number
					]
				],
				[SwitchKit.ISDN_Formatted_IE.Calling_Party_Number,
					[
						ISDN.TypeOfNumber.International_Number,
						ISDN.NumberingPlan.ISDN_numbering_plan_Recommendation_E_164,
						ISDN.PresentationIndicator.Presentation_allowed,
						ISDN.ScreeningIndicator.Network_provided,
						calling_number
					]
				],
			],
		],
	]

	switchkit.sendOutseizeControl(context, span, channel, ICBs)
    }
})



