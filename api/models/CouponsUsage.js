const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const schema = new Schema(
	{
		coupon: {
			type: Mongoose.Types.ObjectId,
			ref: 'coupons',
			required: true,
		},
		user: {
			type: Mongoose.Types.ObjectId,
			ref: 'users',
			required: true,
		},
		order: {
			type: Mongoose.Types.ObjectId,
			ref: 'orders',
			required: true,
		},
		inserted_at: { type: Number, default: Date.now },
	},
	{ versionKey: false, timestamps: false },
);

const model = Mongoose.model('coupons_usage', schema);
module.exports = model;
