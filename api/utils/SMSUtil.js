const Logger = require('./../utils/Logger');
const Config = require('./../../config');
const BASE_URL = 'http://sms.txly.in/vb/apikey.php';
const Axios = require('axios');
const moment = require('moment');

async function sendSMS(payload) {
	try {
		const res = await Axios.get(BASE_URL, { params: payload });
		if (res.data.status !== 'success') {
			res.data.message = 'Failed to send SMS!';
			Logger.log(res.data);
		}
	} catch (err) {
		Logger.log(err);
	}
}

module.exports = {
	sendLoginOTP: async (number, otp) => {
		let payload = {
			apikey: Config.SMS_API_KEY,
			senderid: Config.SMS_SENDER_ID,
			templateid: Config.SMS_OTP_TEMPLATE_ID,
			number: number,
			message: `${otp} is your OTP to login to Runtailor. DO NOT share with anyone. Runtailor never calls to ask for OTP. The OTP expires in 10 mins. - Runtailor.`,
		};
		await sendSMS(payload);
	},

	sendOrderConfirmationSMS: async (number, order_no, epoch_time) => {
		let formatted_date = moment.unix(epoch_time).format('dd-MMMM-YYYY');
		let payload = {
			apikey: Config.SMS_API_KEY,
			senderid: Config.SMS_SENDER_ID,
			templateid: Config.SMS_OTP_TEMPLATE_ID,
			number: number,
			message: `Sit Back And Relax. Your Order Is Confirmed ${order_no} on ${formatted_date}. We know you can't wait to get your hands on it, so we've begun prepping for it right away. - Runtailor.`,
		};
		await sendSMS(payload);
	},
};
