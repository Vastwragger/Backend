const Mongoose = require('mongoose');
const Constants = require('../utils/Constants');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		name: { type: String, required: true },
		type: { type: String, required: true, enum: Object.values(Constants.CATEGORY_TYPES) },
		image: { type: String, required: true },
		is_active: { type: Boolean, default: true },
		is_deleted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('categories', schema);
module.exports = model;
