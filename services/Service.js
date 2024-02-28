const Path = require('path');
require('dotenv').config({ path: Path.join(__dirname, './../.env') });

const MethodOverride = require('method-override');
const Express = require('express');
const CookieParser = require('cookie-parser');
const Upload = require('express-fileupload');
const ResponseTime = require('response-time');
const Mongoose = require('mongoose');
const I18N = require('i18n');
const Config = require('./../config');
const Constants = require('../api/utils/Constants');
const AuthUtil = require('../api/utils/AuthUtil');
const Logger = require('../api/utils/Logger');

Mongoose.set('strictQuery', true);
Mongoose.connect(Config.DATABASE_URL, Constants.MONGOOSE_OPTIONS, (err) => {
	if (err) {
		Logger.log(err);
		throw Error(`Failed to connect to ${Config.DATABASE_URL}`);
	} else {
		Logger.log(`Connected to ${Config.DATABASE_URL}`);
	}
});

module.exports = {
	getApp: () => {
		const App = Express();
		App.use(Express.json({ limit: '25mb' }));
		App.use(Express.urlencoded({ extended: true, limit: '25mb' }));
		App.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', req.headers.origin);
			res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
			res.header(
				'Access-Control-Allow-Headers',
				'Origin, X-Requested-With, Content-Type, Accept, Authorization, Accept-Language',
			);
			next();
		});
		App.use(MethodOverride());
		App.use(CookieParser());
		App.use(ResponseTime());
		App.use(Upload());
		I18N.configure({
			locales: ['en'],
			directory: Path.join(__dirname, './../locales'),
			defaultLocale: Config.DEFAULT_LOCALE,
			updateFiles: false,
		});
		App.use(I18N.init);
		App.use(AuthUtil.decodeToken);
		App.use(Logger.logRequest);
		App.use(Logger.logResponse);
		return App;
	},
};
