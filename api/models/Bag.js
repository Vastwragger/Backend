const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		user_id: { type: String, required: true },
		type: { type: String, required: true },
		item: {
			type: Mongoose.Types.ObjectId,
			ref: 'items',
			required: true,
		},
		services: [
			{
				type: Mongoose.Types.ObjectId,
				ref: 'services',
			},
		],
		quantity: { type: Number, default: 1 },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('bags', schema);
module.exports = model;
