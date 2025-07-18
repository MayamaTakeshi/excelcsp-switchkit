
let SwitchKit = require('../SwitchKit')
let ISDN = require('../ISDN')
let sbu = require('../switchkit_build_utils')

let context = 1
let span = 80
let channel = 23

let msg = {
	_func_name_: 'SendMsg',
	tag: SwitchKit.Tag.ReleaseChannel,
	context: context,
	SpanA: span,
	ChannelA: channel,
	SpanB: span,
	ChannelB: channel,
}

msg = JSON.stringify(msg)
console.log(msg)
