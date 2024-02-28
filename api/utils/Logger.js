const Winston = require('winston');
const Constants = require('./Constants');
const { combine, timestamp, json } = Winston.format;
const Config = require('./../../config');
const DailyRotateFile = require('winston-daily-rotate-file');
const { v4: UUID } = require('uuid');

const logsFile = `${Constants.FOLDERS.FOLDER_DATA_LOGS}/%DATE%.log`;
const transport = new DailyRotateFile({
	filename: logsFile,
	datePattern: 'YYYY-MM-DD',
	maxFiles: 4,
});

const logger = Winston.createLogger({
	format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
	transports: [transport],
});

if (Config.ENV !== Constants.ENV_TYPES.PROD && Config.ENV !== Constants.ENV_TYPES.TEST) {
	logger.add(
		new Winston.transports.Console({
			format: Winston.format.json(),
		}),
	);
}

async function log(data) {
	logger.info(data);
}

module.exports = {
	log: async (msg) => {
		await log({ data: msg });
	},

	logRequest: async (req, res, next) => {
		req.req_id = UUID();
		let data = {
			req_id: req.req_id,
			url: req.url,
			method: req.method,
			body: req.body,
		};
		if (req.decoded_data) data.user_id = req.decoded_data.user_id;
		await log(data);
		next();
	},

	logResponse: async (req, res, next) => {
		res.on('finish', async () => {
			let data = {
				req_id: req.req_id,
				status_code: res.statusCode,
				response_time: res.get('x-response-time'),
			};
			await log(data);
		});
		next();
	},
};
