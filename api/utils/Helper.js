const Format = require('string-template');
const Bcrypt = require('bcryptjs');
const { v4: UUID } = require('uuid');
const FS = require('fs');
const Constants = require('./Constants');
const { customAlphabet } = require('nanoid');

const asyncErrorHandler = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch((err) => {
		const error = {
			status: 522,
			message: err.stack,
		};
		next(error);
	});
};

module.exports = {
	asyncErrorHandler,

	parseString: (string, replacements) => {
		return Format(string, replacements);
	},

	sendErrorResponse: (res, message, code) => {
		return res.status(code ?? 400).json({
			status: false,
			message: message,
		});
	},

	sendSuccessResponse: (res, message, code, data) => {
		return res.status(code ?? 200).json({
			status: true,
			message: message,
			data: data,
		});
	},

	getUniqueHash: () => {
		return UUID();
	},

	generateRandomNumber: (length = 6) => {
		return customAlphabet('123456789', length)();
	},

	createFolders: () => {
		Object.values(Constants.FOLDERS).forEach((folder) => {
			if (!FS.existsSync(folder)) {
				FS.mkdirSync(folder, { recursive: true });
			}
		});
	},

	isValidEmail: (email) => {
		if (email.length !== 0 && email.indexOf('.') >= 0 && email.indexOf('@') >= 0) return true;
		return false;
	},

	getHashedPassword: (pwd) => {
		const salt = Bcrypt.genSaltSync(10);
		return Bcrypt.hashSync(pwd, salt);
	},

	getObjectReplica: (data, properties) => {
		const unwanted = properties ?? [];
		const dt = {};
		const keys = Object.keys(data);
		keys.forEach((key) => {
			if (!unwanted.includes(key)) dt[key] = data[key];
		});
		return dt;
	},

	comparePasswords: (plainPwd, hashedPwd) => {
		return Bcrypt.compareSync(plainPwd, hashedPwd);
	},
};
