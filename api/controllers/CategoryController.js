/* eslint-disable prettier/prettier */
/* eslint-disable consistent-return */
const { sendErrorResponse, sendSuccessResponse } = require('../utils/Helper');
const categoryService = require('./../services/categoryService');
const categoryValidator = require('../validations/categoryValidations');
const StorageUtil = require('./../utils/StorageUtil');
const Constants = require('./../utils/Constants');
const Helper = require('./../utils/Helper');
const mongoose = require('mongoose');

module.exports = {
	ping: async (req, res) => {
		if (mongoose.connection.readyState === Constants.DB_CONNECTED) {
			return sendSuccessResponse(
				res,
				Helper.parseString(res.__('service_ok'), { service_name: 'Admin Service' }),
			);
		}
		return sendErrorResponse(
			res,
			Helper.parseString(res.__('service_error'), { service_name: 'Admin Service' }),
			521,
		);
	},

	createCategory: async (req, res) => {
		const user_details = req.decoded_data;
		let { name, type } = req.body;
		const { error } = categoryValidator.validateCreate({ name, type });
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += `${err.message};`;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}

		const category = await categoryService.uniqueNameCheck({ name, type });
		if (!category) {
			return sendErrorResponse(res, 'This category name in this type already exists', 409);
		}
		let details = { name, type };
		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${user_details.user_id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			details.image = response.Location;
		}
		const result = await categoryService.createCategory(details);
		return sendSuccessResponse(res, `Category ${name} created for the type ${type}`, 201, result);
	},

	getAll: async (req, res) => {
		const type = req.query.type;
		const { error } = categoryValidator.validateGetAll(req.query);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += `${err.message};`;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}
		let matchQuery = { is_deleted: { $ne: true }, is_active: true };
		if (type) matchQuery.type = type;
		const response = await categoryService.getAll(matchQuery);
		return sendSuccessResponse(res, res.__('success'), 200, response);
	},

	getCategoryById: async (req, res) => {
		const { _id } = req.query;
		if (!_id) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		const response = await categoryService.getCategoryById(_id);
		if (response) {
			return sendSuccessResponse(res, 'category retrieved successfully', 200, response);
		}
		return sendErrorResponse(res, "requested category doesn't exist");
	},

	updateCategory: async (req, res) => {
		let payload = {};
		const user_details = req.decoded_data;
		const id = req.body._id;
		let requestBody = req.body;
		const { error } = categoryValidator.validateUpdate(requestBody);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += err.message;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}
		const category = await categoryService.getCategoryById(id);
		if (!category) {
			return sendErrorResponse(res, "requested category doesn't exist");
		}
		payload.name = requestBody.name;
		payload.type = category.type;
		if (payload.name) {
			const exists = await categoryService.uniqueNameCheck(payload, [category._id]);
			if (!exists) {
				return sendErrorResponse(res, "Can't update category, the category name already exist", 400);
			}
		} else {
			payload.name = category.name;
		}
		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${user_details.user_id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			requestBody.image = response.Location;
			if (category.image) await StorageUtil.deleteImage(category.image);
		}
		const response = await categoryService.updateCategory(requestBody, id);
		if (response) {
			return sendSuccessResponse(res, `Category updated successfully`, 200, response);
		}
		return sendErrorResponse(res, 'Error in updating category');
	},

	deleteCategory: async (req, res) => {
		const id = req.query._id;
		const response = await categoryService.deleteCategory(id);
		if (response) {
			sendSuccessResponse(res, `Category deleted successfully`, 200, response);
		} else {
			sendErrorResponse(res, 'Error in deleting category', 400);
		}
	},
};
