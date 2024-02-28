const Constants = require('../utils/Constants');
const Helper = require('../utils/Helper');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/Helper');
const { Users, OTP } = require('./../models');
const AuthUtil = require('./../utils/AuthUtil');
const SMSUtil = require('./../utils/SMSUtil');
const Config = require('./../../config');

module.exports = {
	login: async (req, res) => {
		const { mobile, password } = req.body;
		const user = await Users.findOne({ mobile, is_deleted: false }).lean();
		if (!user) {
			return sendErrorResponse(res, res.__('no_user_with_mobile'), 404);
		}
		if (!user.is_active) {
			return sendErrorResponse(res, res.__('deactivated_account'), 403);
		}
		if (!Helper.comparePasswords(password, user.password)) {
			return sendErrorResponse(res, res.__('incorrect_pwd'), 403);
		}
		const token = AuthUtil.signToken(user._id, user.first_name, user.country_code, user.mobile, user.role);
		delete user.password;
		delete user.is_deleted;
		delete user.is_active;
		delete user.cart;
		return sendSuccessResponse(res, res.__('success'), 200, { token, user });
	},

	sendOtp: async (req, res) => {
		const { mobile } = req.body;
		let user = await Users.findOne({ mobile: mobile }).lean();
		if ((user && !user.is_active) || (user && user.is_deleted)) {
			return sendErrorResponse(res, res.__('deactivated_account'), 400);
		}
		if (mobile !== Constants.DEFAULT_CREDS.MOBILE) {
			if (Config.ENV === Constants.ENV_TYPES.PROD) {
				const threshold = Date.now() - 1000 * 60 * 30;
				let otps = await OTP.countDocuments({ mobile: mobile, inserted_at: { $gt: threshold } });
				if (otps === 3) {
					return sendErrorResponse(res, res.__('too_many_requests'), 429);
				}
			}
			let code = Helper.generateRandomNumber();
			await new OTP({ otp: code, mobile }).save();
			await SMSUtil.sendLoginOTP(mobile, code);
		} else {
			await new OTP({ otp: Constants.DEFAULT_CREDS.OTP, mobile }).save();
		}
		return sendSuccessResponse(res, res.__('otp_sent'));
	},

	verifyOtp: async (req, res) => {
		const { mobile, otp } = req.body;
		if (!mobile || !otp) {
			return sendErrorResponse(res, res.__('params_missing'), 400);
		}
		const otp_record = await OTP.findOne({ mobile, is_active: true }).sort({ inserted_at: -1 });
		if (!otp_record) {
			return sendErrorResponse(res, res.__('invalid_request'), 400);
		}
		if (Date.now() - otp_record.inserted_at > 1000 * 60 * 10) {
			return sendErrorResponse(res, res.__('otp_expired'), 400);
		}
		if (!otp_record.is_active) {
			return sendErrorResponse(res, res.__('otp_already_used'), 400);
		}
		if (otp_record.otp !== otp) {
			return sendErrorResponse(res, res.__('incorrect_otp'), 400);
		}
		let user = await Users.findOne({ mobile: mobile }).lean();
		if ((user && !user.is_active) || (user && user.is_deleted)) {
			return sendErrorResponse(res, res.__('deactivated_account'), 400);
		}
		if (!user) {
			user = await new Users({
				country_code: '+91',
				mobile: mobile,
				role: Constants.ROLES.USER,
			}).save();
		}
		otp_record.is_active = false;
		await otp_record.save();
		delete user.password;
		delete user.is_active;
		delete user.is_deleted;
		delete user.cart;
		let token = AuthUtil.signToken(user._id, user.first_name ?? 'N/A', '+91', user.mobile, Constants.ROLES.USER);
		return sendSuccessResponse(res, res.__('success'), 200, {
			token: token,
			user: user,
		});
	},
};
