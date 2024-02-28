const Mongoose = require('mongoose');
const Constants = require('../utils/Constants');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		user: {
			type: Mongoose.Types.ObjectId,
			ref: 'users',
		},
		title: { type: String, required: true },
		type: { type: String, required: true, enum: Object.values(Constants.NOTIFICATION_TYPES) },
		message: { type: String, required: true },
		is_viewed: { type: Boolean, default: false },
		is_deleted: { type: Boolean, default: false },
		is_broadcasted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('notifications', schema);
module.exports = model;
