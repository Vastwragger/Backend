const { Notifications } = require('../api/models');
const Logger = require('../api/utils/Logger');

module.exports = {
	execute: async () => {
		const threshold = Date.now() - 1000 * 60 * 60 * 24 * 30;
		await Notifications.updateMany({ inserted_at: { $lt: threshold } }, { is_deleted: true });
		Logger.log('ClearNotifications Completed');
	},
};
