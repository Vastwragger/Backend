const Logger = require('./../utils/Logger');
const Config = require('./../../config');
const Axios = require('axios');
const moment = require('moment');

async function sendSMS(payload) {
	try {
		let BASE_URL = `https://manage.txly.in/vb/apikey.php?apikey=${payload.apikey}&senderid=${payload.senderid}&templateid=${payload.templateid}&number=${payload.number}&message=${payload.message}`;
		const res = await Axios.get(BASE_URL);
		if (res.data.status !== 'Success') {
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
			message: `Welcome%20to%20Vast%20Wragger%0A%0AYour%20OTP%20for%20secure%20login%20is:%20${otp}%0A%0AThanks%20for%20trusting%20us.%20Visit%20www.vastwragger.com%20for%20amazing%20deals%20or%20support.%0A%0ATeam%20Vast%20Wragger`,
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
