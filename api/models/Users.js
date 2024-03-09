const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		name: { type: String },
		country_code: { type: String, required: true },
		mobile: { type: String, required: true },
		email: { type: String, lowercase: true, trim: true },
		role: { type: String, required: true },
		password: String,
		image: { type: String },
		gender: { type: String },
		addresses: [
			{
				label: { type: String, required: true },
				line1: { type: String, required: true },
				line2: String,
				city: { type: String, required: true },
				state: { type: String, required: true },
				country: { type: String, required: true },
				pincode: { type: String, required: true },
				is_default: { type: Boolean, default: false },
				lat: Number,
				lng: Number,
			},
		],
		is_active: { type: Boolean, default: true },
		is_deleted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('users', schema);
module.exports = model;
