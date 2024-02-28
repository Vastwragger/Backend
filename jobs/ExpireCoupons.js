const { Coupons } = require('../api/models');
const Logger = require('../api/utils/Logger');

module.exports = {
	execute: async () => {
		await Coupons.updateMany({ end_date: { $lt: Date.now() } }, { is_expired: true });
		Logger.log('ExpireCoupons Completed');
	},
};
