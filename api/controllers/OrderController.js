const mongoose = require('mongoose');
const Constants = require('./../utils/Constants');
const Helper = require('../utils/Helper');
const { Bag, Items, Orders, Users, Reviews, CouponsUsage } = require('../models');
const { sendSuccessResponse, sendErrorResponse } = Helper;
const OrderService = require('../services/OrderService');
const PaymentUtil = require('./../utils/PaymentUtil');
const Logger = require('../utils/Logger');
const StorageUtil = require('./../utils/StorageUtil');
const SMSUtil = require('./../utils/SMSUtil');

module.exports = {
	ping: async (req, res) => {
		if (mongoose.connection.readyState === Constants.DB_CONNECTED) {
			return res.status(200).send({
				status: true,
				message: Helper.parseString(res.__('service_ok'), { service_name: 'Order Service' }),
			});
		}
		return res.status(521).json({
			status: false,
			message: Helper.parseString(res.__('service_error'), { service_name: 'Order Service' }),
		});
	},

	addToBagItems: async (req, res) => {
		const { type, item, services, quantity, coupon_id } = req.body;
		const { user_id } = req.decoded_data;
		if (
			!Object.values(Constants.CATEGORY_TYPES).includes(type) ||
			!item ||
			!services ||
			!Array.isArray(services) ||
			!quantity
		) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		const item_record = await Items.findById(item);
		if (!item_record) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let records = await Bag.find({ user_id }, '-user_id -updated_at');
		let record = records.find((it) => it.item.toString() === item);
		if (record) {
			if (record.type === Constants.CATEGORY_TYPES.ALTER) {
				let entries = record.services.concat(services.filter((it) => record.services.indexOf(it) < 0));
				if (entries.length < record.services.length + services.length) record.quantity += 1;
				record.services = entries;
				await record.save();
			} else {
				record.quantity += quantity;
				await record.save();
			}
		} else {
			await new Bag({
				user_id,
				type,
				item,
				services,
				quantity,
			}).save();
		}
		if (type === Constants.CATEGORY_TYPES.ALTER) {
			let result = await OrderService.getBagItems(user_id, null, coupon_id);
			return sendSuccessResponse(res, res.__('added'), 201, result.alter);
		}
		let result = await OrderService.getBagItems(user_id, coupon_id, null);
		return sendSuccessResponse(res, res.__('added'), 201, result.stitch);
	},

	updateBagItems: async (req, res) => {
		let { bag_item_id, services, quantity, coupon_id } = req.body;
		const { user_id } = req.decoded_data;
		if (!bag_item_id || (services && !Array.isArray(services))) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let record = await Bag.findById(bag_item_id);
		if (!record) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		if (services) record.services = services;
		if (quantity !== undefined) record.quantity = quantity;
		if (record.quantity === 0) {
			await Bag.findByIdAndDelete(bag_item_id);
		} else {
			await record.save();
		}
		if (record.type === Constants.CATEGORY_TYPES.ALTER) {
			let result = await OrderService.getBagItems(user_id, null, coupon_id);
			return sendSuccessResponse(res, res.__('updated'), 200, result.alter);
		}
		let result = await OrderService.getBagItems(user_id, coupon_id, null);
		return sendSuccessResponse(res, res.__('updated'), 200, result.stitch);
	},

	getBagItems: async (req, res) => {
		const { user_id } = req.decoded_data;
		const { coupon_id, service_type } = req.query;
		if (!service_type) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (service_type === Constants.CATEGORY_TYPES.ALTER) {
			let result = await OrderService.getBagItems(user_id, null, coupon_id);
			return sendSuccessResponse(res, res.__('updated'), 200, result.alter);
		}
		let result = await OrderService.getBagItems(user_id, coupon_id, null);
		return sendSuccessResponse(res, res.__('updated'), 200, result.stitch);
	},

	placeOrder: async (req, res) => {
		const { from_bag, type, items, address_id, coupon_id, date, slot } = req.body;
		const { user_id } = req.decoded_data;
		if (
			from_bag === undefined ||
			!type ||
			!Object.values(Constants.CATEGORY_TYPES).includes(type) ||
			!items ||
			!Array.isArray(items) ||
			!address_id ||
			!date ||
			!slot
		) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let is_valid = true;
		items.forEach((item) => {
			if (
				!item.item ||
				!item.services ||
				!Array.isArray(item.services) ||
				!item.quantity ||
				(item.price === undefined && type === Constants.CATEGORY_TYPES.STITCH)
			) {
				is_valid = false;
			}
			item.services.forEach((service) => {
				if (!service.service || !service.price) {
					is_valid = false;
				}
			});
		});
		if (!is_valid) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let user = await Users.findById(user_id, 'first_name email mobile addresses').lean();
		let address = user.addresses.find((it) => it._id.toString() === address_id);
		if (!address) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let order_id;
		while (!order_id) {
			let id = Helper.generateRandomNumber(8);
			let check = await Orders.exists({ order_id: id });
			if (!check) {
				order_id = id;
			}
		}
		let amount = 0;
		if (type === Constants.CATEGORY_TYPES.ALTER) {
			items.forEach((item) => {
				let services_total = 0;
				item.services.forEach((service) => {
					services_total += service.price * item.quantity;
				});
				item.price = services_total;
				amount += services_total;
			});
		} else {
			items.forEach((item) => {
				amount += item.price * item.quantity;
			});
		}
		let discount_amount = await OrderService.calculateDiscount(amount, coupon_id);
		let status = Constants.ORDER_STATUSES.PENDING;
		let order = new Orders({
			user_id,
			order_id,
			from_bag,
			type,
			items,
			cart_amount: amount,
			visiting_charges: Constants.DEFAULT_VISITING_CHARGES,
			discount: discount_amount.discount,
			final_amount: discount_amount.discounted_price + Constants.DEFAULT_VISITING_CHARGES,
			status: status,
			shipping_address: address,
			billing_address: address,
			date,
			slot,
			timeline: [{ status: status }],
			coupon: coupon_id,
		});
		let payment = await PaymentUtil.createPaymentRequest(
			order._id,
			user.first_name,
			user.email,
			user.mobile,
			order.final_amount,
		);
		if (!payment.status) {
			return sendSuccessResponse(res, res.__('went_wrong'));
		}
		order.payment_id = payment.data.id;
		order.payment_details = [payment.data];
		await order.save();
		order = order.toObject();
		delete order.payment_details;
		delete order.payment_id;
		return sendSuccessResponse(res, res.__('success'), 200, {
			order,
			payment_url: payment.data.longurl,
		});
	},

	getOrders: async (req, res) => {
		const { user_id } = req.decoded_data;
		const orders = await Orders.find({ user_id }, 'order_id type items final_amount status')
			.populate('items.item', 'name description image')
			.populate('items.services.service', 'name description image')
			.sort({ inserted_at: -1 })
			.lean();
		return sendSuccessResponse(res, res.__('success'), 200, orders);
	},

	getOrderDetails: async (req, res) => {
		const { order_id } = req.query;
		const order = await Orders.findById(order_id, '-user_id -payment_id -payment_details')
			.populate('items.item', 'name description image')
			.populate('items.services.service', 'name description image')
			.populate('coupon', 'name description code')
			.populate('review', 'rating comment image');
		if (!order) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		return sendSuccessResponse(res, res.__('success'), 200, order);
	},

	instamojoWebhook: async (req, res) => {
		const { payment_request_id: payment_id } = req.body;
		let order = await Orders.findOne({ payment_id });
		if (!order) {
			Logger.log('Incorrect payment id', req.body);
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		if (order.status !== Constants.ORDER_STATUSES.PENDING) {
			return sendSuccessResponse(res, res.__('success'));
		}
		const result = await PaymentUtil.verifyPayment(payment_id);
		if (result.data) order.payment_details.push(req.body);
		let status = result.status ? Constants.ORDER_STATUSES.CONFIRMED : Constants.ORDER_STATUSES.PAYMENT_FAILED;
		order.status = status;
		order.timeline.push({ status });
		order.updated_at = Date.now();
		await order.save();
		if (status === Constants.ORDER_STATUSES.CONFIRMED) {
			if (order.coupon) {
				await new CouponsUsage({
					coupon: order.coupon,
					user: order.user_id,
					order: order._id,
				}).save();
			}
			if (order.from_bag) await Bag.deleteMany({ user_id: order.user_id });
			let user = await Users.findById(order.user_id, 'mobile');
			await SMSUtil.sendOrderConfirmationSMS(user.mobile, order.order_id, order.inserted_at);
		}
		return sendSuccessResponse(res, res.__('success'));
	},

	verifyPayment: async (req, res) => {
		const { order_id } = req.body;
		const { mobile } = req.decoded_data;
		let order = await Orders.findById(order_id);
		if (!order) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		if (order.status !== Constants.ORDER_STATUSES.PENDING) {
			return sendSuccessResponse(res, res.__('success'), 200, {
				is_payment_done: order.status === Constants.ORDER_STATUSES.CONFIRMED,
			});
		}
		const result = await PaymentUtil.verifyPayment(order.payment_id);
		if (result.data) order.payment_details.push(result.data);
		let status = result.status ? Constants.ORDER_STATUSES.CONFIRMED : Constants.ORDER_STATUSES.PAYMENT_FAILED;
		order.status = status;
		order.timeline.push({ status });
		order.updated_at = Date.now();
		await order.save();
		if (status === Constants.ORDER_STATUSES.CONFIRMED) {
			if (order.coupon) {
				await new CouponsUsage({
					coupon: order.coupon,
					user: order.user_id,
					order: order._id,
				}).save();
			}
			if (order.from_bag) await Bag.deleteMany({ user_id: order.user_id });
			await SMSUtil.sendOrderConfirmationSMS(mobile, order.order_id, order.inserted_at);
		}
		return sendSuccessResponse(res, res.__('success'), 200, {
			is_payment_done: status === Constants.ORDER_STATUSES.CONFIRMED,
		});
	},

	postReview: async (req, res) => {
		let { order_id, rating, comment } = req.body;
		rating = parseInt(!rating || rating.length === 0 ? 0 : rating, 10);
		const { user_id } = req.decoded_data;
		if (!order_id || (!rating && !comment) || rating < 1 || rating > 5) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		let order = await Orders.findById(order_id, 'user_id items review')
			.populate('review', 'rating comment image')
			.lean();
		if (!order || order.user_id.toString() !== user_id || order.review) {
			return sendErrorResponse(res, res.__('invalid_request'), 404);
		}
		let images = [];
		if (req.files) {
			let keys = Object.keys(req.files);
			for (let i = 0; i < keys.length; i++) {
				let image = req.files[keys[i]];
				let title = `${order_id}-${Date.now()}${image.name.substring(image.name.lastIndexOf('.'))}`;
				let response = await StorageUtil.uploadImage(title, image.data, image.mimetype);
				images.push(response.Location);
			}
		}
		let item_ids = [];
		order.items.forEach((item) => {
			item_ids.push(item.item);
		});
		let items = await Items.find({ _id: { $in: item_ids } }, 'total_ratings ratings_sum overall_rating');
		let review = await Reviews({
			order: order_id,
			items: item_ids,
			user: user_id,
			rating,
			comment,
			images,
		}).save();
		await Orders.findByIdAndUpdate(order_id, { review: review._id });
		if (rating !== 0) {
			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				item.total_ratings += 1;
				item.ratings_sum += rating;
				item.overall_rating = item.ratings_sum / item.total_ratings;
				await item.save();
			}
		}
		return sendSuccessResponse(res, res.__('success'), 201, review);
	},
};
