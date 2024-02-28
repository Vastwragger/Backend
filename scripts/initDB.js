const Mongoose = require('mongoose');
const Config = require('./../config');
const Constants = require('../api/utils/Constants');
const Logger = require('../api/utils/Logger');

module.exports = {
	connect: async () => {
		Mongoose.set('strictQuery', true);
		try {
			await Mongoose.connect(Config.DATABASE_URL, Constants.MONGOOSE_OPTIONS);
			Logger.log(`Connected to ${Config.DATABASE_URL}`);
		} catch (err) {
			Logger.log(err);
			throw Error(`Failed to connect to ${Config.DATABASE_URL}`);
		}
	},
};
