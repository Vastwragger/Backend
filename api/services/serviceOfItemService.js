/* eslint-disable prettier/prettier */
const { Services } = require('../models');
const {updateItem, pullServiceFromItem} = require('./ItemService')
const mongoose = require('mongoose');

async function uniqueNameCheck(payload, exclude = []) {
	let name = payload.name.toLowerCase();
	const result = await Services.findOne({
		name: { $regex: new RegExp('^' + name + '$', 'i') },
		_id: { $nin: exclude },
		is_deleted: { $ne: true },
	}).lean();

	if (result) {
		return false;
	}
	return true;
}

async function getServiceByName(name) {
	const category = await Services.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') }, is_deleted: { $ne: true } }).lean();
	return category;
}

async function createService(payload, itemId, name) {
	let newService
	if(!name){
			let service = new Services({
			name: payload.name,
			image: payload.image || '-',
			description: payload.description || '',
			price: payload.price || 0,
		});
		newService = await service.save();
	}else{
		newService = await getServiceByName(name)
	}
    let query = {services: [newService._id.toString()]}
    updateItem(query, itemId)
	return newService;
}

async function removeService(serviceId, itemId) {
	let id = new mongoose.Types.ObjectId(serviceId);
	const result = await Services.findByIdAndUpdate(id, { is_deleted: true });
    pullServiceFromItem(itemId, serviceId)
	return result;
}

async function getServiceById(serviceId) {
    let id = new mongoose.Types.ObjectId(serviceId);
	const category = await Services.findOne({ _id: id, is_deleted: { $ne: true } }).lean();
	return category;
}

async function updateService(payload) {
	let serviceId = new mongoose.Types.ObjectId(payload.serviceId);
    delete payload.serviceId
	let updatedItem = await Services.updateOne({ _id: serviceId, is_deleted: { $ne: true } }, { $set: payload }, {upsert:true}).exec();
	return updatedItem;
}

module.exports = {
    uniqueNameCheck,
    createService,
    removeService,
    getServiceById,
    updateService,
	getServiceByName
}