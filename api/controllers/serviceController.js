/* eslint-disable prettier/prettier */
const { sendErrorResponse, sendSuccessResponse } = require('../utils/Helper');
const Services = require('../services/serviceOfItemService');
const Validator = require('../validations/serviceValidator');
const StorageUtil = require('../utils/StorageUtil');

module.exports = {
	createService: async (req, res) => {
		const user_details = req.decoded_data;
		let requestBody = req.body;
		const itemId = requestBody.itemId;
		if (!itemId) {
			return sendErrorResponse(res, res.__('params_missing'));
		}
		const { error } = Validator.validateCreate(req.boby);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += err.message;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}

		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${user_details.user_id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			requestBody.image = response.Location;
		}
		const result = await Services.createService(requestBody, itemId);
		return sendSuccessResponse(res, `Service ${requestBody.name} successfully created.`, 200, {
			id: result,
		});
	},

	updateService: async (req, res) => {
		let requestBody = req.body;
		const serviceId = requestBody.serviceId;
		const { error } = Validator.validateUpdate(req.body);
		if (error) {
			let summaryMessage = '';
			error.details.forEach((err) => {
				summaryMessage += `${err.message};`;
			});
			return sendErrorResponse(res, summaryMessage, 400);
		}
		const service = await Services.getServiceById(serviceId);
		if (!service) {
			return sendErrorResponse(res, "requested service doesn't exist", 400);
		}
		if (requestBody.name) {
			const exists = await Services.uniqueNameCheck(requestBody, [service._id]);
			if (!exists) {
				return sendErrorResponse(res, "Can't update service, the item name already exist", 400);
			}
		}
		let files = req.files;
		if (files && files.image) {
			let file = files.image;
			let title = `${service._id}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
			let response = await StorageUtil.uploadImage(title, file.data, file.mimetype);
			requestBody.image = response.Location;
			if (service.image) await StorageUtil.deleteImage(service.image);
		}
		requestBody.updated_at = Date.now();

		const response = await Services.updateService(requestBody);
		if (response) return sendSuccessResponse(res, `service updated successfully`);
		return sendErrorResponse(res, 'Error in updating service', 400);
	},

	removeService: async (req, res) => {
		const { serviceId, itemId } = req.query;
		const response = await Services.removeService(serviceId, itemId);
		if (response) {
			return sendSuccessResponse(res, `Service deleted successfully`, 200, response);
		}
		return sendErrorResponse(res, 'Error in deleting service');
	},
};
