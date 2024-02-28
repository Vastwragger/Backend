const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		date: { type: String, required: true },
		is_active: { type: Boolean, default: true },
		is_deleted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('offline_dates', schema);
module.exports = model;
