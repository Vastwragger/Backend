/* eslint-disable prettier/prettier */
const Http = require('http');
const App = require('./Service').getApp();
const Logger = require('../api/utils/Logger');
const Routes = require('./../api/routes/AdminRoutes');
const Config = require('./../config');
const Constants = require('../api/utils/Constants');

App.use('/api/admin', Routes);
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
	Server.listen(Config.PORT_ADMIN);
	Server.on('listening', () => {
		Logger.log(`Admin service started on ${Config.PORT_ADMIN}`);
	});
}

module.exports = App;
