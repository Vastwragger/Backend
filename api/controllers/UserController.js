/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const Constants = require('./../utils/Constants');
const Config = require('./../../config');
const { Users, OTP } = require('./../models');
const { sendErrorResponse, sendSuccessResponse, parseString } = require('../utils/Helper');
const Helper = require('../utils/Helper');
const StorageUtil = require('./../utils/StorageUtil');
const SMSUtil = require('./../utils/SMSUtil');
const OrderService = require('../services/OrderService');

module.exports = {
	ping: async (req, res) => {
		if (mongoose.connection.readyState === Constants.DB_CONNECTED) {
			return res.status(200).send({
				status: true,
				message: parseString(res.__('service_ok'), { service_name: 'User Service' }),
			});
		}
		return res.status(521).json({
			status: false,
			message: parseString(res.__('service_error'), { service_name: 'User Service' }),
		});
	},

	addUser: async (req, res) => {
		const { first_name, last_name, mobile, role } = req.body;
		if (!first_name || !last_name || !mobile || !role) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (!Object.values(Constants.ROLES).includes(role)) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let alreadyInUse = await Users.exists({ mobile: mobile });
		if (alreadyInUse) {
			return sendErrorResponse(res, res.__('mobile_already_in_use'));
		}
		let record = {
			first_name,
			last_name,
			country_code: '+91',
			mobile,
			role,
			password: Helper.getHashedPassword('123456'),
		};
		let result = await Users(record).save();
		result = result.toObject();
		delete result.password;
		delete result.is_active;
		delete result.is_deleted;
		return sendSuccessResponse(res, res.__('added'), 201, result);
	},

	getUsers: async (req, res) => {
		const { pageNo, pageSize, search } = req.query;
		let page_num = parseInt(pageNo, 10);
		let limit = parseInt(pageSize, 10);
		let start_index = (page_num - 1) * pageSize;
		let label = search ?? '';
		let records = await Users.find(
			{
				$or: [
					{ first_name: { $regex: label, $options: 'i' } },
					{ last_name: { $regex: label, $options: 'i' } },
				],
			},
			'-password',
		)
			.sort({ inserted_at: -1 })
			.skip(start_index)
			.limit(limit)
			.lean();
		return sendSuccessResponse(res, res.__('success'), 200, records);
	},

	updateProfile: async (req, res) => {
		const user_details = req.decoded_data;
		const { first_name, last_name, email } = req.body;
		if (!first_name || !last_name) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		let user = await Users.findById(user_details.user_id, 'first_name image').lean();
		const details = {
			first_name,
			last_name,
		};
		if (email) details.email = email;
		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${user_details.user_id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			details.image = response.Location;
			if (user.image) await StorageUtil.deleteImage(user.image);
		}
		let record = await Users.findByIdAndUpdate(user_details.user_id, details, { new: true }).select(
			'-password -is_active -is_deleted',
		);
		return sendSuccessResponse(res, res.__('updated'), 200, record);
	},

	updateUserStatus: async (req, res) => {
		const { user_id, is_active, is_deleted } = req.body;
		if (!user_id) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		let data = {};
		if (is_active !== undefined) data.is_active = is_active;
		if (is_deleted !== undefined) data.is_deleted = is_deleted;
		await Users.findByIdAndUpdate(user_id, data);
		return sendSuccessResponse(res, res.__('updated'));
	},

	getProfile: async (req, res) => {
		let data = req.decoded_data;
		let { stitch_coupon_id, alter_coupon_id } = req.query;
		let user = await Users.findById(data.user_id, '-password').lean();
		if (!user) {
			return sendErrorResponse(res, res.__('res_not_found'), 404);
		}
		user.cart = await OrderService.getBagItems(user._id, stitch_coupon_id, alter_coupon_id);
		return sendSuccessResponse(res, res.__('success'), 200, user);
	},

	getDetailsById: async (req, res) => {
		const { user_id } = req.query;
		if (!user_id) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		let user = await Users.findById(user_id, '-password');
		if (!user) {
			return sendErrorResponse(res, res.__('res_not_found'), 404);
		}
		return sendSuccessResponse(res, res.__('success'), 200, user);
	},

	sendOTP: async (req, res) => {
		const { mobile, is_new } = req.body;
		const user_details = req.decoded_data;
		if (is_new) {
			let check = await Users.exists({ mobile, _id: { $ne: user_details.user_id } });
			if (check) {
				return sendErrorResponse(res, res.__('mobile_already_in_use'), 409);
			}
		} else if (mobile !== user_details.mobile) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		if (mobile !== Constants.DEFAULT_CREDS.MOBILE && Config.ENV !== Constants.ENV_TYPES.TEST) {
			const threshold = Date.now() - 1000 * 60 * 30;
			let otps = await OTP.countDocuments({ mobile: mobile, inserted_at: { $gt: threshold } });
			if (otps === 3) {
				return sendErrorResponse(res, res.__('too_many_requests'), 429);
			}
			let code = Helper.generateRandomNumber();
			await new OTP({ otp: code, mobile }).save();
			await SMSUtil.sendLoginOTP(mobile, code);
		} else {
			await new OTP({ otp: Constants.DEFAULT_CREDS.OTP, mobile }).save();
		}
		return sendSuccessResponse(res, res.__('otp_sent'));
	},

	verifyOTP: async (req, res) => {
		const { mobile, otp, is_new } = req.body;
		const user_details = req.decoded_data;
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
		let user = await Users.findById(user_details.user_id);
		if ((user && !user.is_active) || (user && user.is_deleted)) {
			return sendErrorResponse(res, res.__('deactivated_account'), 400);
		}
		if (is_new) {
			user.mobile = mobile;
			await user.save();
		}
		otp_record.is_active = false;
		await otp_record.save();
		delete user.password;
		delete user.is_active;
		delete user.is_deleted;
		return sendSuccessResponse(res, res.__('success'), 200, user);
	},

	addAddress: async (req, res) => {
		const { label, line1, line2, city, state, country, pincode, is_default, lat, lng } = req.body;
		const user_data = req.decoded_data;
		if (!label || !line1 || !city || !state || !country || !pincode || is_default === undefined) {
			return sendErrorResponse(res, res.__('params_missing'), 400);
		}
		const user = await Users.findById(user_data.user_id);
		if (!user) {
			return sendErrorResponse(res, res.__('res_not_found'), 404);
		}
		let check = user.addresses.find((it) => it.label === label);
		if (check) {
			return sendErrorResponse(res, res.__('label_already_in_use'), 400);
		}
		let record = {
			label,
			line1,
			line2,
			city,
			state,
			country,
			pincode,
			is_default,
			lat,
			lng,
		};
		if (is_default) {
			user.addresses.forEach((address) => {
				address.is_default = false;
			});
		}
		user.addresses.push(record);
		await user.save();
		return sendSuccessResponse(res, res.__('added'), 201, user.addresses);
	},

	editAddress: async (req, res) => {
		const { address_id, label, line1, line2, city, state, country, pincode, is_default, lat, lng } = req.body;
		const user_data = req.decoded_data;
		if (!address_id || !label || !line1 || !city || !state || !country || !pincode || is_default === undefined) {
			return sendErrorResponse(res, res.__('params_missing'), 400);
		}
		const user = await Users.findById(user_data.user_id);
		if (!user) {
			return sendErrorResponse(res, res.__('res_not_found'), 404);
		}
		let check = user.addresses.find((it) => it.label === label && it._id !== address_id);
		if (check) {
			return sendErrorResponse(res, res.__('label_already_in_use'), 400);
		}
		let record = {
			_id: address_id,
			label,
			line1,
			line2,
			city,
			state,
			country,
			pincode,
			is_default,
			lat,
			lng,
		};
		if (is_default) {
			user.addresses.forEach((address) => {
				address.is_default = false;
			});
		}
		let index = user.addresses.findIndex((it) => it._id.toString() === address_id);
		user.addresses.splice(index, 1);
		user.addresses.push(record);
		await user.save();
		return sendSuccessResponse(res, res.__('updated'), 200, user.addresses);
	},

	getAddresses: async (req, res) => {
		const user_data = req.decoded_data;
		const user = await Users.findById(user_data.user_id, 'addresses');
		if (!user) {
			return sendErrorResponse(res, res.__('res_not_found'), 404);
		}
		return sendSuccessResponse(res, res.__('success'), 200, user.addresses);
	},

	deleteAddress: async (req, res) => {
		const { address_id } = req.query;
		const user_data = req.decoded_data;
		if (!address_id) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		let record = await Users.findByIdAndUpdate(
			user_data.user_id,
			{ $pull: { addresses: { _id: address_id } } },
			{ new: true },
		);
		return sendSuccessResponse(res, res.__('deleted'), 200, record.addresses);
	},
};
