const Joi = require('joi');

const createService = Joi.object().keys({
	name: Joi.string()
		.regex(/^(?! )/)
		.required(),
	description: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	image: Joi.string().required(),
	price: Joi.number().optional(),
	itemId: Joi.string().required(),
});

const updateService = Joi.object().keys({
	name: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	description: Joi.string()
		.regex(/^(?! )/)
		.optional(),
	image: Joi.string().optional(),
	price: Joi.number().optional(),
	serviceId: Joi.string().required(),
});

function validateCreate(requestBody) {
	return createService.validate(requestBody, { abortEarly: false });
}

function validateUpdate(requestBody) {
	return updateService.validate(requestBody, { abortEarly: false });
}

module.exports = {
	validateCreate,
	validateUpdate,
};
