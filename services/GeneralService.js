const Http = require('http');
const App = require('./Service').getApp();
const GeneralRoutes = require('./../api/routes/GeneralRoutes');
const Logger = require('../api/utils/Logger');
const Config = require('./../config');
const Jobs = require('../jobs');
const Constants = require('../api/utils/Constants');
const Helper = require('./../api/utils/Helper');

Helper.createFolders();
Jobs.scheduleJobs();

App.use('/api', GeneralRoutes);
App.use('*', (req, res, next) => {
	const err = {
		status: 404,
		message: res.__('api_not_found'),
	};
	next(err, req, res, next);
});

// eslint-disable-next-line no-unused-vars
App.use((err, req, res, next) => {
	return res.status(err.status).json({
		status: false,
		message: err.message,
	});
});

if (Config.ENV !== Constants.ENV_TYPES.TEST) {
	const Server = Http.createServer(App);
	Server.listen(Config.PORT_GENERAL);
	Server.on('listening', () => {
		Logger.log(`General service started on ${Config.PORT_GENERAL}`);
	});
}

module.exports = App;
