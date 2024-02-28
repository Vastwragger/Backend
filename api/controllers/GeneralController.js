const mongoose = require('mongoose');
const Constants = require('./../utils/Constants');
const Config = require('./../../config');
const Logger = require('./../utils/Logger');
const { sendErrorResponse, sendSuccessResponse } = require('./../utils/Helper');
const Helper = require('../utils/Helper');
const { Notifications, Banners, Items, Categories, Services, Reviews } = require('../models');
const { CategoriesData, ItemsData, ServicesData } = require('./../../master_data');
const StorageUtil = require('./../utils/StorageUtil');
const Axios = require('axios');
const GMAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

module.exports = {
	ping: async (req, res) => {
		if (mongoose.connection.readyState === Constants.DB_CONNECTED) {
			return sendSuccessResponse(
				res,
				Helper.parseString(res.__('service_ok'), { service_name: 'General Service' }),
			);
		}
		return sendErrorResponse(
			res,
			Helper.parseString(res.__('service_error'), { service_name: 'General Service' }),
			521,
		);
	},

	seedDatabase: async (req, res) => {
		const { everything, categories, items, services } = req.body;
		if (!everything && !categories && !items && !services) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (everything) {
			await Categories.deleteMany({});
			await Items.deleteMany({});
			await Services.deleteMany({});
			await Categories.insertMany(CategoriesData);
			await Services.insertMany(ServicesData);
			await Items.insertMany(ItemsData);
		}
		if (categories) {
			await Categories.deleteMany({});
			await Categories.insertMany(CategoriesData);
		}
		if (items) {
			await Items.deleteMany({});
			await Items.insertMany(ItemsData);
		}
		if (services) {
			await Services.deleteMany({});
			await Services.insertMany(ServicesData);
		}
		return sendSuccessResponse(res, res.__('added'));
	},

	publishNotification: async (req, res) => {
		const { title, type, message } = req.body;
		if (!title || !type || !message) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		if (!Object.values(Constants.NOTIFICATION_TYPES).includes(type)) {
			return sendErrorResponse(res, res.__('invalid_request'));
		}
		const record = {
			title,
			type,
			message,
			is_broadcasted: true,
		};
		let notification = await new Notifications(record).save();
		return sendSuccessResponse(res, res.__('added'), 201, notification);
	},

	getNotifications: async (req, res) => {
		const user_data = req.decoded_data;
		const notifications = await Notifications.find(
			{
				is_deleted: false,
				$or: [{ is_broadcasted: true }, { user: user_data.user_id }],
			},
			'-is_deleted',
		)
			.sort({ inserted_at: -1 })
			.lean();
		return sendSuccessResponse(res, res.__('success'), 200, notifications);
	},

	markAsViewed: async (req, res) => {
		const user_data = req.decoded_data;
		await Notifications.updateMany({ user: user_data.user_id }, { is_viewed: true });
		return sendSuccessResponse(res, res.__('updated'));
	},

	clearNotifications: async (req, res) => {
		const user_data = req.decoded_data;
		const { notification_id } = req.query;
		if (notification_id) {
			let notification = await Notifications.findById(notification_id);
			if (notification.is_broadcasted && user_data.role !== Constants.ROLES.ADMIN) {
				return sendErrorResponse(res, res.__('not_authorized'), 403);
			}
			await Notifications.findByIdAndUpdate(notification_id, { is_deleted: true });
		} else {
			await Notifications.updateMany({ user: user_data.user_id }, { is_deleted: true });
		}
		return sendSuccessResponse(res, res.__('updated'));
	},

	addBanner: async (req, res) => {
		if (!req.files || !req.files.image) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		let file = req.files.image;
		let title = `banner-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
		let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
		let record = await new Banners({ image: response.Location }).save();
		return sendSuccessResponse(res, res.__('added'), 201, record);
	},

	deleteBanner: async (req, res) => {
		const { banner_id } = req.query;
		await Banners.findByIdAndUpdate(banner_id, { is_deleted: true });
		return sendSuccessResponse(res, res.__('deleted'));
	},

	getBanners: async (req, res) => {
		let records = await Banners.find({ is_deleted: false }, 'image').sort({ inserted_at: -1 });
		return sendSuccessResponse(res, res.__('success'), 200, records);
	},

	getLocationDetails: async (req, res) => {
		const { lat, lng } = req.query;
		if (!lat || !lng) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		const params = {
			latlng: lat + ',' + lng,
			key: Config.GOOGLE_MAPS_API_KEY,
		};
		const response = await Axios.get(`${GMAPS_BASE_URL}/geocode/json`, { params });
		if (response.status !== Axios.HttpStatusCode.Ok) {
			Logger.log(response);
			sendErrorResponse(res, res.__('went_wrong'));
		}
		const results = response.data.results;
		const streetAddress = results.find((r) => r.types.includes('street_address')) || results[0];
		let formattedAddress = streetAddress.formatted_address.split(', ');
		let name = formattedAddress[0];

		if (name?.match(/\+/)?.length || name?.match(/\d/)?.length) {
			name = formattedAddress[1];
			formattedAddress = formattedAddress.slice(2);
		}
		return sendSuccessResponse(res, res.__('success'), 200, {
			name,
			address: formattedAddress.join(', '),
		});
	},

	getPlaces: async (req, res) => {
		const { query } = req.query;
		if (!query?.trim()) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		const params = {
			input: query,
			inputtype: 'textquery',
			fields: 'formatted_address,name,geometry',
			key: Config.GOOGLE_MAPS_API_KEY,
		};
		const response = await Axios.get(`${GMAPS_BASE_URL}/place/findplacefromtext/json`, { params });
		if (response.status !== Axios.HttpStatusCode.Ok) {
			Logger.log(response);
			sendErrorResponse(res, res.__('went_wrong'));
		}
		const places =
			response.data?.candidates?.map((c) => ({
				coordinates: c.geometry.location || {},
				place: {
					name: c.name,
					address: c.formatted_address,
				},
			})) || [];
		return sendSuccessResponse(res, res.__('success'), 200, places);
	},

	getDashboardReviews: async (req, res) => {
		let records = await Reviews.find({ show_on_dashboard: true }, 'user rating comment images').populate(
			'user',
			'first_name last_name mobile image',
		);
		return sendSuccessResponse(res, res.__('success'), 200, records);
	},

	searchItems: async (req, res) => {
		let search = req.query.search || '';
		let items = await Items.find(
			{
				name: { $regex: search, $options: 'i' },
				type: Constants.CATEGORY_TYPES.ALTER,
				is_deleted: false,
				is_active: true,
			},
			'name category type',
		)
			.populate('category', 'name')
			.lean();
		return sendSuccessResponse(res, res.__('success'), 200, items);
	},
};
