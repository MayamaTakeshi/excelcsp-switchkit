const {SKProxyClient, SwitchKit, ISDN} = require('../index')


const args = {
    proxy_host: '192.168.2.101',
    proxy_port: 1313,
    app_name: 'test',
    app_version: '1.0.0',
    app_description: 'a_test_app',
    instance_id: 1234,
    host: '192.168.33.3',
    port: 1312,
}

const client = new SKProxyClient(args)

client.on('event', evt => {
    console.log('event', evt)
    if(evt._event_ == 'skj_initialize_ok') {
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

        client.sendOutseizeControl(context, span, channel, ICBs)
    }
})

