
let SwitchKit = require('./SwitchKit')
let ISDN = require('./ISDN')
let sbu = require('./switchkit_build_utils')

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

let msg = sbu.buildOutseizeControl(context, span, channel, ICBs)
msg = JSON.stringify(msg)
console.log(msg)
