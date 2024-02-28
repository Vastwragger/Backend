/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/Helper');
const itemService = require('../services/ItemService');
const itemValidator = require('../validations/itemValidations');
const StorageUtil = require('./../utils/StorageUtil');
const { Reviews } = require('./../models');

module.exports = {
	createItem: async (req, res) => {
		const user_details = req.decoded_data;
		let requestBody = req.body;
		const { error } = itemValidator.validateCreate(req.boby);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += err.message;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}
		if (requestBody.tags) requestBody.tags = requestBody.tags.split(',');
		const item = await itemService.uniqueNameCheck(requestBody);
		if (!item) {
			return sendErrorResponse(res, `Item Name already exists ${requestBody.type} type`, 400);
		}
		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${user_details.user_id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			requestBody.image = response.Location;
		}
		const result = await itemService.createItem(requestBody);
		return sendSuccessResponse(
			res,
			`Item ${requestBody.name} successfully created for the type ${requestBody.type}.`,
			200,
			result,
		);
	},

	getAll: async (req, res) => {
		const type = req.query.serviceType?.toUpperCase();
		const { error } = itemValidator.validateGetAll(req.query);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += err.message;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}
		let matchQuery = {
			type: type,
			is_active: true,
			is_deleted: { $ne: true },
		};
		if (req.query.category) {
			matchQuery.category = new mongoose.Types.ObjectId(req.query.category);
		}
		if (req.query.tag) {
			matchQuery.tags = req.query.tag;
		}
		const response = await itemService.getAll(matchQuery);
		return sendSuccessResponse(res, `all items are retrieved successflly`, 200, response);
	},

	getItemById: async (req, res) => {
		const { id } = req.query;
		if (!id) {
			sendErrorResponse(res, res.__('params_missing'));
		}
		const response = await itemService.getItemById(id);
		if (response) {
			response.reviews = await Reviews.find(
				{ is_deleted: false, items: response._id },
				'user rating comment images',
			).populate('user', 'first_name last_name mobile image');
			return sendSuccessResponse(res, 'item retrieved successfully', 200, response);
		}
		return sendErrorResponse(res, "requested item doesn't exist", 400);
	},

	updateItem: async (req, res) => {
		let requestBody = req.body;
		const id = req.query.id;
		const { error } = itemValidator.validateUpdate(req.body);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += `${err.message};`;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}
		if (requestBody.tags) requestBody.tags = requestBody.tags.split(',');
		if (requestBody.services) requestBody.services = requestBody.services.split(',');
		const item = await itemService.getItemById(id);
		if (!item) {
			return sendErrorResponse(res, "requested item doesn't exist", 400);
		}
		if (requestBody.name) {
			const exists = await itemService.uniqueNameCheck(requestBody, [item._id]);
			if (!exists) {
				return sendErrorResponse(res, "Can't update item, the item name already exist", 400);
			}
		}
		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${item._id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			requestBody.image = response.Location;
			if (item.image) await StorageUtil.deleteImage(item.image);
		}
		requestBody.type = requestBody.type.toUpperCase();
		requestBody.updated_at = Date.now();
		const response = await itemService.updateItem(requestBody, id);
		if (response) return sendSuccessResponse(res, `item updated successfully`);
		return sendErrorResponse(res, 'Error in updating item', 400);
	},

	deleteItem: async (req, res) => {
		const id = req.query.id;
		const response = await itemService.deleteItem(id);
		if (response) {
			return sendSuccessResponse(res, `Item deleted successfully`, 200, response);
		}
		return sendErrorResponse(res, 'Error in deleting item');
	},
};
