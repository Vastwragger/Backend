/* eslint-disable prettier/prettier */
const Joi = require('joi');
const Constants = require('./../utils/Constants');

const getAllCategories = Joi.object().keys({
	type: Joi.string().valid(Constants.CATEGORY_TYPES.STITCH, Constants.CATEGORY_TYPES.ALTER).insensitive().optional(),
});
const updateCategory = Joi.object().keys({
	name: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	image: Joi.string().optional(),
	_id: Joi.string(),
});
const createCategory = Joi.object().keys({
	name: Joi.string()
		.regex(/^(?! )/)
		.required(),
	type: Joi.string().valid(Constants.CATEGORY_TYPES.STITCH, Constants.CATEGORY_TYPES.ALTER).required(),
	image: Joi.string().optional(),
});

function validateCreate(requestBody) {
	return createCategory.validate(requestBody, { abortEarly: false });
}
function validateGetAll(requestBody) {
	return getAllCategories.validate(requestBody, { abortEarly: false });
}
function validateUpdate(requestBody) {
	return updateCategory.validate(requestBody, { abortEarly: false });
}

module.exports = {
	validateCreate,
	validateGetAll,
	validateUpdate,
};
