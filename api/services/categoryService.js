/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const { Categories } = require('../models');

/**
 * Create Categoty
 * @param {*} payload
 */
async function createCategory(payload) {
	const category = new Categories({
		name: payload.name,
		type: payload.type.toUpperCase(),
		inserted_at: Date.now(),
		image: payload.image,
	});

	const newCategory = await category.save();
	return newCategory;
}

/**
 *
 * @param {*} payload
 */
async function uniqueNameCheck(payload, exclude = []) {
	let name = payload.name;
	let type = payload.type.toUpperCase();
	const result = await Categories.findOne({
		name: { $regex: new RegExp('^' + name + '$', 'i') },
		_id: { $nin: exclude },
		type: type,
		is_deleted: { $ne: true },
	}).lean();

	if (result) {
		return false;
	}
	return true;
}

async function getAll(matchQuery = {}) {
	const result = await Categories.find(matchQuery, '-is_deleted -is_active -updated_at');
	return result;
}

async function getCount(matchQuery = {}) {
	const count = await Categories.countDocuments(matchQuery);
	return count;
}

async function getCategoryById(categoryId) {
	const category = await Categories.findOne({ _id: categoryId, is_deleted: { $ne: true } }).lean();
	return category;
}

async function updateCategory(payload, categoryId) {
	let updatedcategory = await Categories.findByIdAndUpdate(
		categoryId,
		{ $set: { name: payload.name, image: payload.image, updated_at: Date.now() } },
		{ new: true },
	);
	return updatedcategory;
}

async function deleteCategory(categoryId) {
	let id = new mongoose.Types.ObjectId(categoryId);
	const result = await Categories.findByIdAndUpdate({ _id: id }, { is_deleted: true }, { new: true }).exec();
	return result;
}

/**
 * Get group details by id
 * @param {*} categoryId
 */
async function getByID(categoryId) {
	let id = new mongoose.Types.ObjectId(categoryId);
	const category = await Categories.findById({ _id: id, is_deleted: { $ne: true } }).lean();
	return category;
}

module.exports = {
	createCategory,
	uniqueNameCheck,
	getCount,
	getAll,
	getCategoryById,
	updateCategory,
	deleteCategory,
	getByID,
};
