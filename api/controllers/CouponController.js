const { Coupons, CouponsUsage } = require('../models');
const Constants = require('../utils/Constants');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/Helper');
const OrderService = require('./../services/OrderService');

module.exports = {
	addCoupon: async (req, res) => {
		const {
			name,
			description,
			code,
			is_fixed_discount,
			percentage,
			max_discount,
			amount,
			min_order_amount,
			applicable_items,
			start_date,
			end_date,
			max_usage,
		} = req.body;
		if (!name || !code || is_fixed_discount === undefined || !applicable_items || !start_date || !end_date) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (is_fixed_discount && (!amount || !min_order_amount)) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (!is_fixed_discount && (!percentage || !max_discount)) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (!Array.isArray(applicable_items)) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let check = await Coupons.exists({ code, is_active: true, is_expired: false, is_deleted: false });
		if (check) {
			return sendErrorResponse(res, res.__('code_already_in_use'));
		}
		let record = {
			name,
			description,
			code,
			is_fixed_discount,
			percentage,
			max_discount,
			amount,
			min_order_amount,
			applicable_items,
			start_date,
			end_date,
			max_usage,
		};
		let coupon = await new Coupons(record).save();
		return sendSuccessResponse(res, res.__('added'), 200, coupon);
	},

	updateCoupon: async (req, res) => {
		const {
			coupon_id,
			name,
			description,
			code,
			is_fixed_discount,
			percentage,
			max_discount,
			amount,
			min_order_amount,
			applicable_items,
			start_date,
			end_date,
			max_usage,
		} = req.body;
		if (
			!coupon_id ||
			!name ||
			!code ||
			is_fixed_discount === undefined ||
			!applicable_items ||
			!start_date ||
			!end_date
		) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (is_fixed_discount && (!amount || !min_order_amount)) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (!is_fixed_discount && (!percentage || !max_discount)) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (!Array.isArray(applicable_items)) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let record = {
			name,
			description,
			code,
			is_fixed_discount,
			percentage,
			max_discount,
			amount,
			min_order_amount,
			applicable_items,
			start_date,
			end_date,
			max_usage,
		};
		let coupon = await Coupons.findByIdAndUpdate(coupon_id, record, { new: true });
		return sendSuccessResponse(res, res.__('updated'), 200, coupon);
	},

	deleteCoupon: async (req, res) => {
		const { coupon_id } = req.query;
		await Coupons.findByIdAndUpdate(coupon_id, { is_deleted: true });
		return sendSuccessResponse(res, res.__('deleted'));
	},

	// Todo: Considering items
	getCoupons: async (req, res) => {
		const user_data = req.decoded_data;
		let coupons = await Coupons.find({ is_deleted: false, is_expired: false, is_active: true }).lean();
		let ids = [];
		coupons.forEach((coupon) => {
			ids.push(coupon._id);
		});
		let usage = await CouponsUsage.find({ user: user_data.user_id, coupon: { $in: ids } }).lean();
		let result = [];
		coupons.forEach((coupon) => {
			let count = usage.filter((it) => it.coupon === coupon._id);
			if (count < coupon.max_usage) {
				let {
					_id,
					name,
					description,
					code,
					is_fixed_discount,
					percentage,
					max_discount,
					amount,
					min_order_amount,
					applicable_items,
				} = coupon;
				result.push({
					_id,
					name,
					description,
					code,
					is_fixed_discount,
					percentage,
					max_discount,
					amount,
					min_order_amount,
					applicable_items,
				});
			}
		});
		return sendSuccessResponse(res, res.__('success'), 200, result);
	},

	applyCoupon: async (req, res) => {
		const { items_price, coupon_id } = req.body;
		if (!items_price || !coupon_id) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		let result = await OrderService.calculateDiscount(items_price, coupon_id);
		result.visiting_charges = Constants.DEFAULT_VISITING_CHARGES;
		result.final_price = result.discounted_price + Constants.DEFAULT_VISITING_CHARGES;
		return sendSuccessResponse(res, res.__('success'), 200, result);
	},
};
