/* eslint-disable prettier/prettier */
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		category: {
			type: Mongoose.Types.ObjectId,
			ref: 'categories',
			required: true,
		},
		name: { type: String, required: true },
		type: { type: String, required: true },
		description: String,
		image: String,
		display_image: String,
		price: { type: Number, default: 0 },
		tags: [{ type: String }],
		services: {
			type: [
				{
					type: Mongoose.Types.ObjectId,
					ref: 'services',
				},
			],
			default: [],
		},
		total_ratings: { type: Number, default: 0 },
		ratings_sum: { type: Number, default: 0 },
		overall_rating: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
		is_deleted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('items', schema);
module.exports = model;
