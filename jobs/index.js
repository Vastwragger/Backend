const Cron = require('node-cron');
const Logger = require('../api/utils/Logger');
const ClearNotifications = require('./ClearNotifications');
const ExpireCoupons = require('./ExpireCoupons');

const everyDayAt1201 = '1 0 * * *';

module.exports = {
	scheduleJobs: async () => {
		Cron.schedule(everyDayAt1201, async () => {
			Logger.log('Executing ClearNotifications Job');
			await ClearNotifications.execute();
			Logger.log('Executing ExpireCoupons Job');
			await ExpireCoupons.execute();
		});
	},
};
