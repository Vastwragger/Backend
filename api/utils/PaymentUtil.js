const Logger = require('./../utils/Logger');
const Config = require('./../../config');
const Axios = require('axios');

let token = '';
async function setAuthToken() {
	try {
		const payload = {
			grant_type: 'client_credentials',
			client_id: Config.INSTAMOJO_CLIENT_ID,
			client_secret: Config.INSTAMOJO_CLIENT_SECRET,
		};
		const res = await Axios.post(`${Config.INSTAMOJO_BASE_URL}/oauth2/token/`, payload);
		if (res.status === Axios.HttpStatusCode.Ok) {
			token = res.data.access_token;
		} else {
			Logger.log('Instamojo generate access token call failed' + JSON.stringify(res));
		}
	} catch (err) {
		Logger.log(err);
	}
}

async function makePaymentRequest(payload) {
	const res = await Axios.post(`${Config.INSTAMOJO_BASE_URL}/v2/payment_requests/`, payload, {
		headers: {
			Authorization: 'Bearer ' + token,
		},
	});
	return res;
}

async function verifyPaymentRequest(paymentRequestId) {
	const res = await Axios.get(`${Config.INSTAMOJO_BASE_URL}/v2/payment_requests/${paymentRequestId}/`, {
		headers: {
			Authorization: 'Bearer ' + token,
		},
	});
	return res;
}

async function verifyPaymentCallback(res) {
	const isPaymentDone = res.data?.status?.toLowerCase() === 'completed' && res.data?.payments?.length !== 0;
	return { status: isPaymentDone, data: res.data };
}

module.exports = {
	createPaymentRequest: async (order_id, buyer_name, email, phone, amount) => {
		try {
			if (token.length === 0) {
				await setAuthToken();
				if (token.length === 0) return { status: false };
			}
			const payload = {
				purpose: 'Order Payment',
				amount,
				buyer_name,
				email,
				phone,
				redirect_url: `${Config.FRONTEND_USER_URL}/order-placed?orderId=${order_id}`,
				webhook: `${Config.BACKEND_BASE_URL}/api/order/instamojo-webhook`,
				allow_repeated_payments: false,
			};
			let res = await makePaymentRequest(payload);
			if (res.status === Axios.HttpStatusCode.Created) {
				return { status: true, data: res.data };
			}
			if (res.status === Axios.HttpStatusCode.Unauthorized) {
				await setAuthToken();
				res = await makePaymentRequest(payload);
				if (res.status === Axios.HttpStatusCode.Created) {
					return { status: true, data: res.data };
				}
			}
		} catch (err) {
			Logger.log(err);
		}
		return { status: false };
	},

	verifyPayment: async (paymentRequestId) => {
		try {
			if (token.length === 0) {
				await setAuthToken();
				if (token.length === 0) return { status: false };
			}
			const res = await verifyPaymentRequest(paymentRequestId);
			if (res.status === Axios.HttpStatusCode.Ok) {
				return verifyPaymentCallback(res);
			}
			if (res.status === Axios.HttpStatusCode.Unauthorized) {
				await setAuthToken();
				res = await verifyPaymentRequest(paymentRequestId);
				if (res.status === Axios.HttpStatusCode.Ok) {
					return verifyPaymentCallback(res);
				}
			}
		} catch (err) {
			Logger.log(err);
		}
		return {
			status: false,
		};
	},
};
