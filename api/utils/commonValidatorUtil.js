const { validateObjectId } = require('../validations/commonValidators');
const categoryService = require('../services/categoryService');
const itemService = require('./../services/ItemService');
const Helper = require('../utils/Helper');

module.exports = {
	validateCategoryId: async (req, res, next) => {
		const categoryId = req.query.id || req.query.category;
		if (!validateObjectId(categoryId)) {
			Helper.sendErrorResponse(res, 'Invalid Id', 400);
			return;
		}

		const category = await categoryService.getByID(categoryId);

		if (!category) {
			Helper.sendErrorResponse(res, "Category doesn't exist", 400);
			return;
		}
		req.category = { id: categoryId };
		next();
	},
	validateItemId: async (req, res, next) => {
		const itemId = req.query.id || req.query.category;
		if (!validateObjectId(itemId)) {
			Helper.sendErrorResponse(res, 'Invalid Id', 400);
			return;
		}
		const item = await itemService.getItemById(itemId);
		if (!item) {
			Helper.sendErrorResponse(res, "Item doesn't exist", 400);
			return;
		}
		req.item = { id: itemId };
		next();
	},
};
