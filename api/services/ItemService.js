/* eslint-disable prettier/prettier */
const { Items } = require('../models');
const mongoose = require('mongoose');

/**
 * Create Categoty
 * @param {*} payload
 * @returns
 */
async function createItem(payload) {
	const item = Items({
		name: payload.name,
		image: payload.image,
		description: payload.description || '',
		price: payload.price || 0,
		tags: payload.tags || '',
		type: payload.type.toUpperCase(),
		category: payload.category,
	});

	const newItem = await item.save();
	return newItem;
}

/**
 *
 * @param {*} payload
 * @returns
 */
async function uniqueNameCheck(payload, exclude) {
	let name = payload.name.toLowerCase();
	let type = payload.type.toUpperCase();
	const result = await Items.findOne({
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
	const result = await Items.find(
		matchQuery,
		'-services -total_ratings -ratings_sum -is_active -is_deleted -updated_at',
	).populate('category', 'name');
	return result;
}

async function getCount(matchQuery = {}) {
	const count = await Items.find(matchQuery).countDocuments();
	return count;
}

async function getItemById(itemId) {
	let id = new mongoose.Types.ObjectId(itemId);
	const item = await Items.findOne(
		{ _id: id, is_deleted: { $ne: true } },
		'-total_ratings -ratings_sum -is_active -is_deleted -updated_at',
	)
		.populate('category', 'name type')
		.populate('services', 'name description image price')
		.lean();
	return item;
}

async function updateItem(payload, itemId) {
	let id = new mongoose.Types.ObjectId(itemId);
	let updatedItem = await Items.updateOne(
		{ _id: id, is_deleted: { $ne: true } },
		{ $addToSet: payload },
		{ upsert: true },
	).exec();
	return updatedItem;
}

async function deleteItem(itemId) {
	let id = new mongoose.Types.ObjectId(itemId);
	const result = await Items.findByIdAndUpdate(id, { is_deleted: true });
	return result;
}

async function pullServiceFromItem(itemId, serviceId) {
	let id = new mongoose.Types.ObjectId(itemId);
	let updatedItem = await Items.updateOne(
		{ _id: id, is_deleted: { $ne: true } },
		{ $pull: { services: serviceId } },
		{ upsert: true },
	).exec();
	return updatedItem;
}
async function pushServiceFromItem(itemId, serviceId) {
	let id = new mongoose.Types.ObjectId(itemId);
	let updatedItem = await Items.updateOne(
		{ _id: id, is_deleted: { $ne: true } },
		{ $push: { services: serviceId } },
		{ upsert: true, returnAfter: true },
	).exec();
	return updatedItem;
}

async function getById(itemId) {
	let id = new mongoose.Types.ObjectId(itemId);
	const item = await Items.findOne(
		{ _id: id, is_deleted: { $ne: true } },
		'-total_ratings -ratings_sum -is_active -is_deleted -updated_at',
	);
	return item;
}

module.exports = {
	createItem,
	uniqueNameCheck,
	getCount,
	getAll,
	getItemById,
	updateItem,
	deleteItem,
	pullServiceFromItem,
	pushServiceFromItem,
	getById,
};
