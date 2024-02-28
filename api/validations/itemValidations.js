/* eslint-disable prettier/prettier */
const Joi = require('joi');
const Constants = require('./../utils/Constants');

const getAllItems = Joi.object().keys({
	category: Joi.string().required().optional(),
	tag: Joi.string().required().optional(),
	serviceType: Joi.string()
		.valid(Constants.CATEGORY_TYPES.STITCH, Constants.CATEGORY_TYPES.ALTER)
		.insensitive()
		.required(),
	tag: Joi.string(),
});
const createItem = Joi.object().keys({
	name: Joi.string()
		.regex(/^(?! )/)
		.required(),
	description: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	type: Joi.string().valid(Constants.CATEGORY_TYPES.STITCH, Constants.CATEGORY_TYPES.ALTER).required(),
	price: Joi.number().optional(),
	tags: Joi.string().optional(),
	image: Joi.string().optional(),
	services: Joi.string().optional(),
});
const updateItem = Joi.object().keys({
	id: Joi.string(),
	name: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	description: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	type: Joi.string().valid(Constants.CATEGORY_TYPES.STITCH, Constants.CATEGORY_TYPES.ALTER).required(),
	price: Joi.number().optional(),
	tags: Joi.string().optional(),
	image: Joi.string().optional(),
	services: Joi.string().optional(),
});

function validateCreate(requestBody) {
	return createItem.validate(requestBody, { abortEarly: false });
}
function validateGetAll(requestBody) {
	return getAllItems.validate(requestBody, { abortEarly: false });
}
function validateUpdate(requestBody) {
	return updateItem.validate(requestBody, { abortEarly: false });
}

module.exports = {
	validateCreate,
	validateGetAll,
	validateUpdate,
};
