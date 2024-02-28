const { Coupons, Bag } = require('../models');
const Constants = require('./../utils/Constants');

async function calculateDiscount(items_price, coupon_id) {
	let result = {
		items_price: items_price > 0 ? items_price : 0,
		discounted_price: items_price > 0 ? items_price : 0,
		discount: 0,
	};
	if (!coupon_id || items_price <= 0) return result;
	let coupon = await Coupons.findById(coupon_id).lean();
	if (!coupon) return result;
	if (items_price < coupon.min_order_amount) return result;
	if (coupon.is_fixed_discount) {
		result.discounted_price = items_price - coupon.amount;
		result.discount = coupon.amount;
	} else {
		let discount = (coupon.percentage * items_price) / 100;
		if (discount > coupon.max_discount) discount = coupon.max_discount;
		result.discounted_price = items_price - discount;
		result.discount = discount;
	}
	return result;
}

module.exports = {
	calculateDiscount,

	getBagItems: async (user_id, stitch_coupon_id, alter_coupon_id) => {
		let items = await Bag.find({ user_id }, '-user_id -updated_at')
			.populate('item', 'name image price overall_rating')
			.populate('services', 'name image price')
			.lean();
		let alter_items = items.filter((it) => it.type === Constants.CATEGORY_TYPES.ALTER);
		let stitch_items = items.filter((it) => it.type === Constants.CATEGORY_TYPES.STITCH);
		let bag = {
			alter: {
				bag_items: alter_items,
				visiting_charges: Constants.DEFAULT_VISITING_CHARGES,
				items_price: 0,
				final_price: 0,
				discount: 0,
			},
			stitch: {
				bag_items: stitch_items,
				visiting_charges: Constants.DEFAULT_VISITING_CHARGES,
				items_price: 0,
				final_price: 0,
				discount: 0,
			},
		};
		items.forEach((item) => {
			if (item.type === Constants.CATEGORY_TYPES.ALTER) {
				item.services.forEach((service) => {
					bag.alter.items_price += service.price * item.quantity;
				});
			} else {
				bag.stitch.items_price += item.item.price * item.quantity;
			}
		});
		let prices = null;
		if (stitch_coupon_id) prices = await calculateDiscount(bag.stitch.items_price, stitch_coupon_id);
		let items_price = bag.stitch.items_price;
		if (prices) {
			bag.stitch.discount = prices.discount;
			items_price = prices.discounted_price;
		}
		bag.stitch.final_price = items_price > 0 ? items_price + Constants.DEFAULT_VISITING_CHARGES : 0;
		prices = null;
		if (alter_coupon_id) prices = await calculateDiscount(bag.alter.items_price, alter_coupon_id);
		items_price = bag.alter.items_price;
		if (prices) {
			bag.alter.discount = prices.discount;
			items_price = prices.discounted_price;
		}
		bag.alter.final_price = items_price > 0 ? items_price + Constants.DEFAULT_VISITING_CHARGES : 0;
		return bag;
	},
};
