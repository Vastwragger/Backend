const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		mobile: { type: String, required: true },
		otp: { type: String, required: true },
		is_active: { type: Boolean, default: true }, // Becomes false once used
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('otps', schema);
module.exports = model;
