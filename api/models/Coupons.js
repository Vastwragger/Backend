const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		name: { type: String, required: true },
		description: String,
		code: { type: String, required: true },
		is_fixed_discount: { type: Boolean, required: true },

		// By Percentage
		percentage: { type: Number, default: 0 },
		max_discount: { type: Number, default: 0 },
		// By Fixed Amount
		amount: { type: Number, default: 0 },

		min_order_amount: { type: Number, default: 0 },
		applicable_items: [{ type: Mongoose.Types.ObjectId, ref: 'items' }],
		start_date: { type: Number, default: 0 },
		end_date: { type: Number, required: true },
		// max usage per user
		max_usage: { type: Number, default: 1 },
		is_expired: { type: Boolean, default: false },
		is_active: { type: Boolean, default: true },
		is_deleted: { type: Boolean, default: false },
		inserted_at: { type: Number, default: Date.now },
		updated_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('coupons', schema);
module.exports = model;
