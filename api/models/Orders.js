const Mongoose = require('mongoose');
const Constants = require('../utils/Constants');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		user_id: {
			type: Mongoose.Types.ObjectId,
			required: true,
		},
		from_bag: { type: Boolean, default: false },
		order_id: { type: String, required: true },
		payment_id: { type: String, required: true },
		type: { type: String, required: true, enum: Object.values(Constants.CATEGORY_TYPES) },
		items: [
			{
				item: {
					type: Mongoose.Types.ObjectId,
					ref: 'items',
					required: true,
				},
				price: { type: Number, default: 0 },
				quantity: { type: Number, default: 1 },
				services: [
					{
						service: { type: Mongoose.Types.ObjectId, ref: 'services' },
						price: { type: Number, required: true },
					},
				],
			},
		],
		cart_amount: { type: Number, required: true },
		discount: { type: Number, default: 0 },
		visiting_charges: { type: Number, default: 0 },
		final_amount: { type: Number, required: true },
		status: { type: String, required: true },
		shipping_address: {
			label: { type: String, required: true },
			line1: { type: String, required: true },
			line2: String,
			city: { type: String, required: true },
			state: { type: String, required: true },
			country: { type: String, required: true },
			pincode: { type: String, required: true },
			lat: Number,
			lng: Number,
		},
		billing_address: {
			label: { type: String, required: true },
			line1: { type: String, required: true },
			line2: String,
			city: { type: String, required: true },
			state: { type: String, required: true },
			country: { type: String, required: true },
			pincode: { type: String, required: true },
			lat: Number,
			lng: Number,
		},
		date: { type: Number, required: true },
		slot: { type: String, required: true },
		timeline: [{ status: { type: String, required: true }, inserted_at: { type: Number, default: Date.now } }],
		coupon: {
			type: Mongoose.Types.ObjectId,
			ref: 'coupons',
		},
		review: {
			type: Mongoose.Types.ObjectId,
			ref: 'reviews',
		},
		payment_details: [],
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('orders', schema);
module.exports = model;
