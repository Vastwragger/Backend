/* eslint-disable prettier/prettier */
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const servicesSchema = new Schema({
	name: { type: String, required: true },
	description: String,
	image: { type: String, required: true },
	price: { type: Number, default: 0 },
	is_active: { type: Boolean, default: true },
	is_deleted: { type: Boolean, default: false },
	inserted_at: { type: Number, default: Date.now },
	updated_at: { type: Number, default: Date.now },
});

const model = Mongoose.model('services', servicesSchema);
module.exports = model;
