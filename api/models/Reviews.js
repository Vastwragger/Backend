const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		items: [
			{
				type: Mongoose.Types.ObjectId,
				ref: 'items',
			},
		],
		order: {
			type: Mongoose.Types.ObjectId,
			ref: 'orders',
			required: true,
		},
		user: {
			type: Mongoose.Types.ObjectId,
			ref: 'users',
			required: true,
		},
		rating: { type: Number, default: 0 },
		comment: String,
		images: [String],
		show_on_dashboard: { type: Boolean, default: false },
		is_deleted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('reviews', schema);
module.exports = model;
